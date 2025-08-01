#!/bin/bash
# Script to start servers for E2E tests

echo "Starting E2E test servers..."

# Kill any existing processes on the ports
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8787 | xargs kill -9 2>/dev/null || true

# Start backend server
echo "Starting backend server on port 8787..."
cd apps/backend && pnpm dev &
BACKEND_PID=$!

# Start frontend server
echo "Starting frontend server on port 3000..."
cd ../frontend && pnpm dev &
FRONTEND_PID=$!

# Wait for servers to be ready
echo "Waiting for servers to be ready..."
npx wait-on http://localhost:8787/health http://localhost:3000 -t 60000

echo "Servers are ready!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Trap to ensure servers are stopped on script exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true" EXIT

# Keep script running
wait