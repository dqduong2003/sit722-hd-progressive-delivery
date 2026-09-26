import pytest

from app import fault_injection
from app.fault_injection import FaultInjector


def test_default_mode_is_disabled():
    injector = FaultInjector("off")

    assert injector.enabled is False
    assert injector.should_fault("/users") is False


@pytest.mark.parametrize(
    "mode",
    ["", "   ", "nonsense", "delayed:abc"],
)
def test_unrecognised_modes_fail_safe(mode: str):
    injector = FaultInjector(mode)

    assert injector.enabled is False
    assert injector.should_fault("/users") is False


def test_immediate_mode_faults_from_the_first_request():
    injector = FaultInjector("immediate")

    assert injector.enabled is True
    assert injector.should_fault("/users") is True
    assert injector.should_fault("/auth/login") is True


def test_health_is_never_faulted():
    """The readiness probe must keep passing while the service is faulty.

    This is what makes the injected fault latent: Kubernetes sees a healthy
    pod, so the pod stays in the Service endpoints and keeps receiving
    traffic. If /health could fail, the pod would be removed from the
    endpoints and no 5xx would ever reach the ingress to be measured.
    """

    for mode in ("immediate", "delayed:0"):
        injector = FaultInjector(mode)

        assert injector.should_fault("/health") is False


def test_delayed_mode_arms_on_first_request_then_fires(monkeypatch):
    clock = {"now": 1000.0}

    monkeypatch.setattr(
        fault_injection.time,
        "monotonic",
        lambda: clock["now"],
    )

    injector = FaultInjector("delayed:150")

    assert injector.enabled is True

    # The arming request itself is served normally.
    assert injector.should_fault("/users") is False

    # Still inside the delay window - a pre-traffic smoke test passes here.
    clock["now"] = 1000.0 + 149.0
    assert injector.should_fault("/users") is False

    # Delay elapsed - the fault surfaces only once real traffic has been
    # flowing, which is what the metric-driven rollback gate must catch.
    clock["now"] = 1000.0 + 151.0
    assert injector.should_fault("/users") is True


def test_delayed_mode_clock_starts_at_first_request_not_construction(monkeypatch):
    """Rollout latency must not consume the delay window."""

    clock = {"now": 500.0}

    monkeypatch.setattr(
        fault_injection.time,
        "monotonic",
        lambda: clock["now"],
    )

    injector = FaultInjector("delayed:60")

    # Simulate a slow rollout: plenty of wall-clock time passes before the
    # first request arrives.
    clock["now"] = 500.0 + 600.0

    assert injector.should_fault("/users") is False

    clock["now"] = 500.0 + 600.0 + 59.0
    assert injector.should_fault("/users") is False

    clock["now"] = 500.0 + 600.0 + 61.0
    assert injector.should_fault("/users") is True


def test_health_requests_do_not_arm_the_delay(monkeypatch):
    clock = {"now": 0.0}

    monkeypatch.setattr(
        fault_injection.time,
        "monotonic",
        lambda: clock["now"],
    )

    injector = FaultInjector("delayed:30")

    # Readiness probes hammer /health long before any user traffic; they
    # must not start the clock.
    for _ in range(10):
        clock["now"] += 5.0

        assert injector.should_fault("/health") is False

    # 50s of probes have elapsed, but the first real request only arms now.
    assert injector.should_fault("/users") is False

    clock["now"] += 31.0
    assert injector.should_fault("/users") is True
