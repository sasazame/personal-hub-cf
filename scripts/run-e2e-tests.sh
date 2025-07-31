#!/bin/bash

# Kill any existing servers
echo "Killing any existing servers..."
pkill -f "wrangler dev" || true
pkill -f "vite" || true
sleep 2

# Start backend server
echo "Starting backend server..."
cd apps/backend && pnpm dev &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
sleep 10

# Check if backend is responding
if curl -s http://localhost:8787/health > /dev/null; then
    echo "Backend is ready!"
else
    echo "Backend failed to start!"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Start frontend server
echo "Starting frontend server..."
cd ../frontend && pnpm dev &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
sleep 10

# Check if frontend is responding
if curl -s http://localhost:3000 > /dev/null; then
    echo "Frontend is ready!"
else
    echo "Frontend failed to start!"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Run E2E tests
echo "Running E2E tests..."
cd ../..
SKIP_WEBSERVER=1 npm run test:e2e

# Save exit code
TEST_EXIT_CODE=$?

# Cleanup
echo "Cleaning up..."
kill $BACKEND_PID 2>/dev/null || true
kill $FRONTEND_PID 2>/dev/null || true

exit $TEST_EXIT_CODE