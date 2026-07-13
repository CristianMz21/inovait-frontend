#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ -z "${SONAR_TOKEN:-}" ]]; then
  echo "ERROR: SONAR_TOKEN is required." >&2
  exit 1
fi

SONAR_HOST_URL="${SONAR_HOST_URL:-http://localhost:9000}"
if [[ ! "$SONAR_HOST_URL" =~ ^https:// ]] &&
  [[ ! "$SONAR_HOST_URL" =~ ^http://(localhost|127\.0\.0\.1|\[::1\])(:[0-9]+)?/?$ ]]; then
  echo "ERROR: SONAR_HOST_URL must use HTTPS unless it targets the local machine." >&2
  exit 1
fi

SONAR_TOKEN_VALUE="$SONAR_TOKEN"
export -n SONAR_TOKEN_VALUE
unset SONAR_TOKEN
SCANNER_WORK_DIR="$REPO_ROOT/.scannerwork"
CLEAN_ENV=(env -u SONAR_HOST_URL -u SONAR_TOKEN -u SONAR_TOKEN_VALUE)

cleanup_work_dir() {
  rm -rf -- "$SCANNER_WORK_DIR"
}

cleanup_on_exit() {
  unset SONAR_TOKEN_VALUE
  cleanup_work_dir
}

trap cleanup_on_exit EXIT
cleanup_work_dir

if [[ ! -x "$REPO_ROOT/node_modules/.bin/sonar" ]]; then
  echo "ERROR: SonarScanner is not installed. Run 'npm ci' first." >&2
  exit 1
fi

"${CLEAN_ENV[@]}" npm run lint
"${CLEAN_ENV[@]}" npm run test:coverage
"${CLEAN_ENV[@]}" npm run build:development
"${CLEAN_ENV[@]}" npm run build:production
"${CLEAN_ENV[@]}" npm run e2e
"${CLEAN_ENV[@]}" npm run contract:verify
"${CLEAN_ENV[@]}" npm audit

env -u SONAR_TOKEN_VALUE \
  SONAR_HOST_URL="$SONAR_HOST_URL" \
  SONAR_TOKEN="$SONAR_TOKEN_VALUE" \
  "$REPO_ROOT/node_modules/.bin/sonar"

echo "SonarQube analysis submitted: $SONAR_HOST_URL/dashboard?id=inovait-frontend"
