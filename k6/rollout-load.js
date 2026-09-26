//
// Continuous load against user-service for the duration of a progressive
// rollout.
//
// Purpose: make zero-downtime a measured claim rather than an assertion.
// The Week 05 rolling-update investigation established this method with a
// curl polling loop; k6 is the same idea with concurrency, proper request
// accounting and a machine-readable summary.
//
// This runs INSIDE the cluster as a Kubernetes Job rather than on the
// GitHub Actions runner. Three reasons:
//
//   1. Lifetime. A runner-side generator is bound to the job that started
//      it. Run as a parallel job it has no way to synchronise with the
//      traffic shift, so it either starts before there is anything to
//      measure - polluting the rate() window the rollback gate reads - or
//      stops before the rollout finishes.
//   2. Attribution. If it outlived a rollback it would keep generating
//      failures and report a red result for a run that correctly protected
//      production.
//   3. Reachability. In-cluster it addresses the controller by its Service
//      name, so no public LoadBalancer IP has to be discovered and passed
//      between jobs.
//
// Thresholds are deliberately NOT used to decide success. During a rollback
// demonstration errors are the expected outcome, and letting k6 also fail
// the build would conflate two separate mechanisms. The Prometheus gate in
// 07-progressive-deploy.yml is the sole decision-maker; k6 is evidence.
//
import http from "k6/http";
import { check } from "k6";

const TARGET =
  __ENV.TARGET_URL ||
  "http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/users/";

const HOST_HEADER = __ENV.TARGET_HOST || "koalatech.local";

export const options = {
  // Constant arrival rate, not constant VUs: request volume must stay
  // steady even as latency changes, otherwise a slow or failing version
  // would depress the request count and distort the error RATE that the
  // rollback gate divides by.
  scenarios: {
    rollout: {
      executor: "constant-arrival-rate",
      rate: Number(__ENV.RPS || 20),
      timeUnit: "1s",
      duration: __ENV.DURATION || "10m",
      preAllocatedVUs: 20,
      maxVUs: 60,
    },
  },
  // Errors are an expected outcome of the rollback scenario.
  thresholds: {},
  summaryTrendStats: ["avg", "min", "med", "p(95)", "p(99)", "max"],
};

export default function () {
  const response = http.get(TARGET, {
    headers: { Host: HOST_HEADER },
    tags: { name: "user-service-root" },
  });

  check(response, {
    "status is 200": (r) => r.status === 200,
    "not a server error": (r) => r.status < 500,
  });
}

export function handleSummary(data) {
  const metrics = data.metrics;
  const total = metrics.http_reqs ? metrics.http_reqs.values.count : 0;
  const failedRate = metrics.http_req_failed
    ? metrics.http_req_failed.values.rate
    : 0;

  const lines = [
    "",
    "================ ROLLOUT LOAD SUMMARY ================",
    `Target              : ${TARGET}`,
    `Host header         : ${HOST_HEADER}`,
    `Total requests      : ${total}`,
    `Failed request rate : ${(failedRate * 100).toFixed(2)}%`,
    `Approx failures     : ${Math.round(total * failedRate)}`,
    "======================================================",
    "",
  ];

  return {
    stdout: lines.join("\n"),
    "/dev/stdout": lines.join("\n"),
  };
}
