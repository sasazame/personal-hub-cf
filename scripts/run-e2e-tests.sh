#!/bin/bash
# Enhanced E2E test runner with improved server management

echo "🚀 Starting E2E test run..."

# Parse command line arguments
SKIP_BUILD=false
for arg in "$@"; do
    if [ "$arg" = "--skip-build" ]; then
        SKIP_BUILD=true
    fi
done

# Function to cleanup on exit
cleanup() {
    if [ "$SERVERS_STARTED" = true ]; then
        echo "🧹 Cleaning up servers..."
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Check if servers are already running
FRONTEND_RUNNING=$(lsof -ti:3000 2>/dev/null)
BACKEND_RUNNING=$(lsof -ti:8787 2>/dev/null)

SERVERS_STARTED=false

if [ -n "$FRONTEND_RUNNING" ] && [ -n "$BACKEND_RUNNING" ]; then
    echo "✅ Servers already running (Frontend PID: $FRONTEND_RUNNING, Backend PID: $BACKEND_RUNNING)"
    echo "💡 Using existing servers..."
else
    # Kill any partial servers
    [ -n "$FRONTEND_RUNNING" ] && kill $FRONTEND_RUNNING 2>/dev/null
    [ -n "$BACKEND_RUNNING" ] && kill $BACKEND_RUNNING 2>/dev/null
    sleep 1
    
    if [ "$SKIP_BUILD" = false ]; then
        echo "🏗️  Building packages..."
        pnpm build || { echo "❌ Build failed"; exit 1; }
    fi
    
    echo "🖥️  Starting development servers..."
    
    # Start backend with output to log
    cd apps/backend && pnpm dev > ../../e2e-backend.log 2>&1 &
    BACKEND_PID=$!
    cd ../..
    
    # Start frontend with output to log
    cd apps/frontend && pnpm dev > ../../e2e-frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ../..
    
    SERVERS_STARTED=true
    
    echo "⏳ Waiting for servers to be ready (timeout: 60s)..."
    
    # Use npx wait-on for proper health checks
    if command -v npx &> /dev/null; then
        npx wait-on http://localhost:8787/health http://localhost:3000 -t 60000
        if [ $? -ne 0 ]; then
            echo "❌ Failed to start servers within 60 seconds"
            echo "📋 Backend log (last 20 lines):"
            tail -20 e2e-backend.log
            echo "📋 Frontend log (last 20 lines):"
            tail -20 e2e-frontend.log
            exit 1
        fi
    else
        # Fallback to curl checks
        COUNTER=0
        while [ $COUNTER -lt 60 ]; do
            if curl -s http://localhost:8787/health > /dev/null && curl -s http://localhost:3000 > /dev/null; then
                break
            fi
            sleep 1
            COUNTER=$((COUNTER + 1))
        done
        
        if [ $COUNTER -ge 60 ]; then
            echo "❌ Servers failed to start within 60 seconds"
            exit 1
        fi
    fi
    
    echo "✅ Servers are ready!"
fi

# Run E2E tests - let Playwright handle its own webServer config if needed
echo "🧪 Running E2E tests..."
pnpm test:e2e "$@"
TEST_RESULT=$?

# Show results
if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ All E2E tests passed!"
else
    echo "❌ Some E2E tests failed."
    echo "💡 Run 'pnpm test:e2e:report' to see the HTML report"
    if [ "$SERVERS_STARTED" = true ]; then
        echo "📋 Check e2e-backend.log and e2e-frontend.log for server logs"
    fi
fi

exit $TEST_RESULT