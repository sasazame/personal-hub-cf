#!/bin/bash

# Quality Gate Script - Run all checks before commit/push
# This script runs all quality checks and provides a summary

set -e

echo "🔍 Running Quality Gate Checks..."
echo "================================"

# Track overall status
OVERALL_STATUS=0

# Helper function to run a check
run_check() {
    local name=$1
    local command=$2
    echo -n "► $name: "
    
    start_time=$(date +%s)
    local log_name=$(echo "$name" | tr ' ' '-')
    if eval "$command" > "/tmp/quality-gate-$log_name.log" 2>&1; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        echo "✅ PASS (${duration}s)"
    else
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        echo "❌ FAIL (${duration}s)"
        local log_name=$(echo "$name" | tr ' ' '-')
        echo "  See /tmp/quality-gate-$log_name.log for details"
        OVERALL_STATUS=1
        return 1
    fi
    return 0
}

# 1. TypeScript Check
run_check "TypeScript" "pnpm typecheck"

# 2. Lint Check
run_check "Lint" "pnpm lint"

# 3. Build Check
if [ $OVERALL_STATUS -eq 0 ]; then
    run_check "Build" "pnpm build"
fi

# 4. Unit Tests
if [ $OVERALL_STATUS -eq 0 ]; then
    run_check "Unit Tests" "pnpm test"
fi

# 5. E2E Tests (optional, can be slow)
if [ $OVERALL_STATUS -eq 0 ] && [ "$SKIP_E2E" != "true" ]; then
    # Use quick E2E tests by default (auth tests only)
    if [ "$FULL_E2E" == "true" ]; then
        run_check "E2E Tests (Full)" "pnpm test:e2e"
    else
        run_check "E2E Tests (Quick)" "pnpm test:e2e:quick"
    fi
fi

# 6. Act CI Test (optional, requires Docker)
if [ $OVERALL_STATUS -eq 0 ] && [ "$RUN_ACT" == "true" ] && command -v docker &> /dev/null && docker info &> /dev/null; then
    run_check "Act CI" "./scripts/run-act-e2e.sh"
fi

echo "================================"

if [ $OVERALL_STATUS -eq 0 ]; then
    echo "✅ QUALITY GATE: PASSED"
    echo "Your code is ready to commit!"
else
    echo "❌ QUALITY GATE: FAILED"
    echo "Please fix the errors before committing."
    echo ""
    echo "Check log files in /tmp/quality-gate-*.log for details"
fi

exit $OVERALL_STATUS