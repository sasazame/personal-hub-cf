#!/bin/bash
# Robust E2E test runner with strict error handling and stable paths
set -Eeuo pipefail

echo "🚀 Starting E2E test run (clean start)..."

# Resolve repo root and key paths regardless of invocation location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/apps/backend"
FRONTEND_DIR="$ROOT_DIR/apps/frontend"
BACKEND_LOG="$ROOT_DIR/e2e-backend.log"
FRONTEND_LOG="$ROOT_DIR/e2e-frontend.log"

# Parse command line arguments
SKIP_BUILD=false
for arg in "$@"; do
  if [ "$arg" = "--skip-build" ]; then
    SKIP_BUILD=true
  fi
done

# Cleanup on exit
SERVERS_STARTED=false
BACKEND_PID=""; FRONTEND_PID=""
cleanup() {
  if [ "$SERVERS_STARTED" = true ]; then
    echo "🧹 Cleaning up servers..."
    kill ${BACKEND_PID:-} ${FRONTEND_PID:-} 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Check/kill existing servers
FRONTEND_RUNNING=$(lsof -ti:3000 2>/dev/null || true)
BACKEND_RUNNING=$(lsof -ti:8787 2>/dev/null || true)
if [ -n "${FRONTEND_RUNNING}${BACKEND_RUNNING}" ]; then
  echo "🛑 Killing existing servers on 3000/8787"
  [ -n "$FRONTEND_RUNNING" ] && kill $FRONTEND_RUNNING 2>/dev/null || true
  [ -n "$BACKEND_RUNNING" ] && kill $BACKEND_RUNNING 2>/dev/null || true
  sleep 1
fi

# Build if requested
if [ "$SKIP_BUILD" = false ]; then
  echo "🏗️  Building packages..."
  (cd "$ROOT_DIR" && pnpm build)
fi

echo "🖥️  Starting development servers..."

# Start backend in a subshell to avoid changing CWD
(cd "$BACKEND_DIR" && pnpm dev > "$BACKEND_LOG" 2>&1) & BACKEND_PID=$!

# Start frontend in a subshell to avoid changing CWD
(cd "$FRONTEND_DIR" && pnpm dev > "$FRONTEND_LOG" 2>&1) & FRONTEND_PID=$!

SERVERS_STARTED=true

echo "⏳ Waiting for servers to be ready (timeout: 60s)..."
if command -v npx &>/dev/null; then
  if ! npx wait-on http://localhost:8787/health http://localhost:3000 -t 60000; then
    echo "❌ Failed to start servers within 60 seconds"
    echo "📋 Backend log (last 50 lines):"; tail -n 50 "$BACKEND_LOG" || true
    echo "📋 Frontend log (last 50 lines):"; tail -n 50 "$FRONTEND_LOG" || true
    exit 1
  fi
else
  # Fallback simple curl polling
  for i in {1..60}; do
    if curl -fsS http://localhost:8787/health >/dev/null 2>&1 && curl -fsS http://localhost:3000 >/dev/null 2>&1; then
      break
    fi
    sleep 1
    if [ "$i" -eq 60 ]; then
      echo "❌ Servers failed to start within 60 seconds"
      exit 1
    fi
  done
fi
echo "✅ Servers are ready!"

# Run E2E tests (strip internal flags)
echo "🧪 Running E2E tests..."
cd "$ROOT_DIR"
# Ensure Playwright does not try to start its own webServer; we already did
export SKIP_WEBSERVER=1
# Filter out script-only flags like --skip-build
FILTERED_ARGS=()
for arg in "$@"; do
  if [ "$arg" != "--skip-build" ]; then
    FILTERED_ARGS+=("$arg")
  fi
done
# Provide sensible defaults to avoid long hangs if no args given
if [ ${#FILTERED_ARGS[@]} -eq 0 ]; then
  FILTERED_ARGS=("--reporter=line" "--max-failures=10")
fi

pnpm test:e2e "${FILTERED_ARGS[@]}" || TEST_RESULT=$? || true
TEST_RESULT=${TEST_RESULT:-0}

if [ $TEST_RESULT -eq 0 ]; then
  echo "✅ All E2E tests passed!"
else
  echo "❌ Some E2E tests failed."
  echo "💡 Run 'pnpm test:e2e:report' to see the HTML report"
  echo "📋 Backend log (last 50 lines):"; tail -n 50 "$BACKEND_LOG" || true
  echo "📋 Frontend log (last 50 lines):"; tail -n 50 "$FRONTEND_LOG" || true
fi

exit $TEST_RESULT
