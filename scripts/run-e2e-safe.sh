#!/bin/bash

# Run E2E tests with better error handling

echo "Running E2E tests with safe configuration..."

# Export environment to avoid EPIPE issues
export NODE_NO_WARNINGS=1

# Run tests with minimal output
if [ "$1" == "quick" ]; then
    echo "Running quick E2E test suite..."
    npx playwright test --config=playwright.quick.config.ts --reporter=dot 2>&1
else
    echo "Running full E2E test suite..."
    # Run with reduced workers to avoid resource exhaustion
    npx playwright test --workers=2 --reporter=dot 2>&1
fi

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All E2E tests passed!"
else
    echo "❌ Some E2E tests failed. Exit code: $EXIT_CODE"
    echo "Run 'npx playwright show-report' to see detailed results"
fi

exit $EXIT_CODE