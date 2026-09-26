#!/bin/sh
#
# Smoke test for a single blue/green slot, run INSIDE the cluster against the
# slot-pinned Service.
#
# The point of running it here, at this moment, is that the slot under test is
# reachable by name but receives no user traffic: the stable Service selects
# the other slot and canary-weight is still 0. A total failure at this stage
# is invisible to users, which is the whole reason for deploying to an idle
# slot first.
#
# The checks deliberately go well past /health. /health returns a static 200
# and never touches the database or any application logic, so a release can be
# failing every real request while /health stays green. Testing only /health
# would reproduce the weakness of the Week 08-10 pipeline, where
# `kubectl rollout status` returning success was taken as evidence that a
# release was good.
#
# What this CANNOT catch is a fault that only appears under sustained real
# traffic, or after the service has been running for a while. That is the gap
# the post-shift error-rate gate exists to close, and it is what the
# `delayed:` fault-injection mode demonstrates.
#
set -eu

BASE_URL="${BASE_URL:?BASE_URL must be set}"
ADMIN_USERNAME="${DEFAULT_ADMIN_USERNAME:?DEFAULT_ADMIN_USERNAME must be set}"
ADMIN_PASSWORD="${DEFAULT_ADMIN_PASSWORD:?DEFAULT_ADMIN_PASSWORD must be set}"

CURL="curl --silent --show-error --fail --max-time 10"

echo "Smoke testing ${BASE_URL}"
echo

echo "--> GET /health (liveness only - proves the process is up)"
$CURL "${BASE_URL}/health"
echo
echo

echo "--> GET / (root endpoint, subject to application middleware)"
$CURL "${BASE_URL}/"
echo
echo

echo "--> POST /auth/login (authentication path, exercises the database)"
LOGIN_RESPONSE=$($CURL -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "username=${ADMIN_USERNAME}" \
    --data-urlencode "password=${ADMIN_PASSWORD}")

TOKEN=$(echo "${LOGIN_RESPONSE}" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "${TOKEN}" ]; then
    echo "FAILED: /auth/login returned no access token"
    echo "Response was: ${LOGIN_RESPONSE}"
    exit 1
fi

echo "authenticated OK"
echo

echo "--> GET /users with a bearer token (authorisation + data read)"
$CURL "${BASE_URL}/users" -H "Authorization: Bearer ${TOKEN}" > /dev/null
echo "user list retrieved OK"
echo

echo "--> GET /users without a token (authorisation must REJECT)"
STATUS=$(curl --silent --output /dev/null --write-out '%{http_code}' \
    --max-time 10 "${BASE_URL}/users")

if [ "${STATUS}" != "401" ] && [ "${STATUS}" != "403" ]; then
    echo "FAILED: unauthenticated /users returned ${STATUS}, expected 401 or 403"
    exit 1
fi

echo "unauthenticated request correctly rejected (${STATUS})"
echo

echo "SMOKE TESTS PASSED"
