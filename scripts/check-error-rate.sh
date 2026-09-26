#!/usr/bin/env bash
#
# The rollback gate.
#
# Queries the live HTTP error rate of user-service at the ingress and exits
# non-zero if it breaches threshold. This is the mechanism that makes the
# rollback closed-loop: the decision comes from the running system's own
# telemetry, not from a test result produced before the release went out.
#
# --- Why the query talks to the API server ----------------------------
# The proposal assumed Azure Monitor managed Prometheus. Its query endpoint
# requires an Entra token, and this student tenant blocks service-principal
# creation - the same restriction that stops `azure/login` and
# `terraform apply` running in CI. The in-cluster kube-prometheus-stack
# installed by 06-deploy-monitoring.yml holds the same data and is reachable
# through the API server's service proxy using the admin kubeconfig the
# pipeline already has, so the gate needs no new credential of any kind.
#
# `kubectl port-forward` would also work but is a background process whose
# lifetime is tied to the shell, with a startup race against the first curl
# and a known tendency to drop the tunnel on longer runs. `kubectl get --raw`
# is a single synchronous request with neither problem.
#
# --- Why it fails closed ----------------------------------------------
# Every failure to OBTAIN a measurement is treated as a breach. If Prometheus
# is unreachable, the series is missing, the result is NaN, or traffic is too
# sparse to produce a meaningful ratio, the gate fails and the release rolls
# back. The alternative - treating "no data" as "no errors" - would let a
# broken monitoring stack wave a broken release into production, which is the
# single worst failure mode this design can have.
#
set -euo pipefail

NAMESPACE="${NAMESPACE:-production}"
INGRESS="${INGRESS:-user-service}"
PROM_NAMESPACE="${PROM_NAMESPACE:-monitoring}"
PROM_SERVICE="${PROM_SERVICE:-prometheus-kube-prometheus-prometheus}"
PROM_PORT="${PROM_PORT:-9090}"

WINDOW="${WINDOW:-2m}"

# At canary-weight 10 a totally broken candidate can only push the OVERALL
# error ratio to about 0.10, so an intuitive-sounding threshold like 0.20
# would never fire and the pipeline would ship the broken build while
# reporting success. The canary-only ratio approaches 1.0 whatever the
# weight, which is why it is the primary signal and the overall ratio is a
# secondary blast-radius check.
CANARY_THRESHOLD="${CANARY_THRESHOLD:-0.05}"
OVERALL_THRESHOLD="${OVERALL_THRESHOLD:-0.02}"

# Below this request rate, ratios are dominated by single requests and the
# gate would be deciding on noise.
MIN_TOTAL_RPS="${MIN_TOTAL_RPS:-1}"

BASE_SELECTOR="namespace=\"${NAMESPACE}\",ingress=\"${INGRESS}\""

# The canary label carries nginx's $proxy_alternative_upstream_name, which is
# empty or "-" when the request was served by the stable backend. It is the
# ONLY label that distinguishes the two slots: ingress-nginx merges a canary
# into the stable Ingress's location block, so both the `ingress` and the
# `service` labels report the stable names for canary traffic too.
CANARY_SELECTOR="${BASE_SELECTOR},canary!=\"-\",canary!=\"\""

prometheus_query() {
    local query="$1"
    local encoded

    encoded=$(jq -rn --arg q "${query}" '$q|@uri')

    kubectl get --raw \
        "/api/v1/namespaces/${PROM_NAMESPACE}/services/${PROM_SERVICE}:${PROM_PORT}/proxy/api/v1/query?query=${encoded}"
}

scalar_or_empty() {
    # Returns the sample value, or nothing at all when the query produced no
    # series. The caller decides what "nothing" means - it is never 0.
    jq -r 'if .status != "success" then empty
           elif (.data.result | length) == 0 then empty
           else .data.result[0].value[1] end'
}

is_number() {
    [[ "$1" =~ ^-?[0-9]+([.][0-9]+)?([eE][-+]?[0-9]+)?$ ]]
}

gate_failed=0
fail() {
    echo "GATE FAILED: $*"
    gate_failed=1
}

echo "Evaluating rollback gate over a ${WINDOW} window"
echo "  canary 5xx ratio  threshold: ${CANARY_THRESHOLD}"
echo "  overall 5xx ratio threshold: ${OVERALL_THRESHOLD}"
echo

# ---------------------------------------------------------------- volume
total_rps_query="sum(rate(nginx_ingress_controller_requests{${BASE_SELECTOR}}[${WINDOW}]))"
total_rps_raw=$(prometheus_query "${total_rps_query}" | scalar_or_empty || true)

if [ -z "${total_rps_raw}" ] || ! is_number "${total_rps_raw}"; then
    fail "no request-rate data returned from Prometheus (got '${total_rps_raw:-<empty>}'). Failing closed."
    echo "  query: ${total_rps_query}"
    exit 1
fi

echo "Total request rate: ${total_rps_raw} req/s"

if awk -v a="${total_rps_raw}" -v b="${MIN_TOTAL_RPS}" 'BEGIN { exit !(a < b) }'; then
    fail "request rate ${total_rps_raw}/s is below the ${MIN_TOTAL_RPS}/s minimum - too little traffic to judge this release. Failing closed."
    exit 1
fi

# --------------------------------------------------------- canary ratio
# The numerator is wrapped in `or vector(0)`: a healthy release has NO 5xx
# series at all, so the bare sum() is an empty result, not 0, and an empty
# numerator makes the whole ratio empty - failing the gate on exactly the
# case it should pass. The denominator is deliberately left bare, so no
# traffic at all is still an empty ratio and still fails closed.
canary_query="(sum(rate(nginx_ingress_controller_requests{${CANARY_SELECTOR},status=~\"5..\"}[${WINDOW}])) or vector(0))
/
sum(rate(nginx_ingress_controller_requests{${CANARY_SELECTOR}}[${WINDOW}]))"

canary_raw=$(prometheus_query "${canary_query}" | scalar_or_empty || true)

if [ -z "${canary_raw}" ] || ! is_number "${canary_raw}"; then
    fail "canary error ratio unavailable (got '${canary_raw:-<empty>}'). Either no traffic reached the candidate or Prometheus has no data. Failing closed."
    echo "  query: ${canary_query}"
    exit 1
fi

echo "Candidate (canary) 5xx ratio: ${canary_raw}"

if awk -v a="${canary_raw}" -v b="${CANARY_THRESHOLD}" 'BEGIN { exit !(a > b) }'; then
    fail "candidate 5xx ratio ${canary_raw} exceeds ${CANARY_THRESHOLD}"
fi

# -------------------------------------------------------- overall ratio
overall_query="(sum(rate(nginx_ingress_controller_requests{${BASE_SELECTOR},status=~\"5..\"}[${WINDOW}])) or vector(0))
/
sum(rate(nginx_ingress_controller_requests{${BASE_SELECTOR}}[${WINDOW}]))"

overall_raw=$(prometheus_query "${overall_query}" | scalar_or_empty || true)

if [ -z "${overall_raw}" ] || ! is_number "${overall_raw}"; then
    fail "overall error ratio unavailable (got '${overall_raw:-<empty>}'). Failing closed."
    exit 1
fi

echo "Overall edge 5xx ratio:      ${overall_raw}"

if awk -v a="${overall_raw}" -v b="${OVERALL_THRESHOLD}" 'BEGIN { exit !(a > b) }'; then
    fail "overall 5xx ratio ${overall_raw} exceeds ${OVERALL_THRESHOLD}"
fi

echo
if [ "${gate_failed}" -ne 0 ]; then
    echo "Gate verdict: FAIL - rollback required."
    exit 1
fi

echo "Gate verdict: PASS - error rate within thresholds."
