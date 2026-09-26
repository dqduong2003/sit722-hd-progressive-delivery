import logging
import os
import threading
import time

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


logger = logging.getLogger(__name__)


#
# Paths that are never faulted.
#
# The readiness probe targets /health. If fault injection could fail it, the
# pod would be marked NotReady, the kubelet would remove it from the Service
# endpoints, and the ingress controller would stop routing to it - so no 5xx
# would ever reach the edge and the metric-driven rollback would have nothing
# to observe. Keeping /health honest is what makes the fault *latent*: the
# container stays healthy by every signal Kubernetes has, and only real
# traffic reveals the problem.
#
EXEMPT_PATHS = frozenset({"/health"})

MODE_OFF = "off"
MODE_IMMEDIATE = "immediate"
MODE_DELAYED_PREFIX = "delayed:"


class FaultInjector:
    """Returns HTTP 500 for non-exempt requests once armed and elapsed.

    Controlled by the FAULT_INJECTION_MODE environment variable:

        off               no faults (default)
        immediate         fault every non-exempt request from the first one
        delayed:<seconds> fault non-exempt requests <seconds> after the first
                          non-exempt request is served

    The delayed mode deliberately starts its clock at the first real request
    rather than at process start. Timing from process start would make the
    fault window depend on image pull time, database initialisation and
    rollout latency, so a slow rollout could consume the delay and fire the
    fault during the pre-traffic smoke test instead of after it. Arming on
    first use makes the behaviour reproducible regardless of how long the
    deployment took.
    """

    def __init__(self, mode: str) -> None:
        self._lock = threading.Lock()
        self._armed_at: float | None = None
        self._fired = False

        self.mode = MODE_OFF
        self.delay_seconds = 0.0

        normalised = (mode or MODE_OFF).strip().lower()

        if normalised in ("", MODE_OFF):
            return

        if normalised == MODE_IMMEDIATE:
            self.mode = MODE_IMMEDIATE
            return

        if normalised.startswith(MODE_DELAYED_PREFIX):
            raw_delay = normalised[len(MODE_DELAYED_PREFIX):]

            try:
                self.delay_seconds = float(raw_delay)

            except ValueError:
                logger.warning(
                    "Unparseable delay in FAULT_INJECTION_MODE=%r; "
                    "fault injection stays disabled.",
                    mode,
                )

                return

            self.mode = MODE_DELAYED_PREFIX.rstrip(":")
            return

        logger.warning(
            "Unrecognised FAULT_INJECTION_MODE=%r; "
            "fault injection stays disabled.",
            mode,
        )

    @property
    def enabled(self) -> bool:
        return self.mode != MODE_OFF

    def should_fault(self, path: str) -> bool:
        if not self.enabled:
            return False

        if path in EXEMPT_PATHS:
            return False

        if self.mode == MODE_IMMEDIATE:
            self._log_first_fault()

            return True

        now = time.monotonic()

        with self._lock:
            if self._armed_at is None:
                self._armed_at = now

                logger.warning(
                    "FAULT INJECTION ARMED on first request to %s - "
                    "responses will begin failing in %.0fs.",
                    path,
                    self.delay_seconds,
                )

                return False

            elapsed = now - self._armed_at

        if elapsed < self.delay_seconds:
            return False

        self._log_first_fault()

        return True

    def _log_first_fault(self) -> None:
        with self._lock:
            if self._fired:
                return

            self._fired = True

        logger.error(
            "FAULT INJECTION FIRING - user-service is now returning "
            "HTTP 500 for all non-exempt requests."
        )


def register_fault_injection(app: FastAPI) -> None:
    """Attach the fault-injection middleware if it is configured.

    This exists to demonstrate the pipeline's automated rollback against a
    *latent* fault - one that passes every pre-deployment gate and only
    manifests under production traffic. It is inert unless
    FAULT_INJECTION_MODE is set, and the Kubernetes manifests leave it unset
    on both slots by default.
    """

    injector = FaultInjector(os.getenv("FAULT_INJECTION_MODE", MODE_OFF))

    if not injector.enabled:
        logger.info("Fault injection disabled.")

        return

    logger.warning(
        "Fault injection ENABLED (mode=%s, delay=%.0fs). "
        "This build is intended for rollback demonstration only.",
        injector.mode,
        injector.delay_seconds,
    )

    @app.middleware("http")
    async def _inject_faults(request: Request, call_next):
        if injector.should_fault(request.url.path):
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Injected fault (user-service)",
                    "service": "user-service",
                },
            )

        return await call_next(request)
