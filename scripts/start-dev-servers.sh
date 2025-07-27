#!/bin/bash

# Kill any existing processes on the ports
echo "Killing processes on ports 8787 and 3000..."
lsof -ti:8787 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Give processes time to die
sleep 2

# Start backend
echo "Starting backend server..."
cd apps/backend
pnpm dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:8787/health > /dev/null; then
    echo "Backend is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Backend failed to start. Check /tmp/backend.log"
    cat /tmp/backend.log
    exit 1
  fi
  sleep 1
done

# Start frontend
echo "Starting frontend server..."
cd apps/frontend
pnpm dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:3000 > /dev/null; then
    echo "Frontend is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Frontend failed to start. Check /tmp/frontend.log"
    cat /tmp/frontend.log
    exit 1
  fi
  sleep 1
done

echo "Both servers are running!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Run 'kill $BACKEND_PID $FRONTEND_PID' to stop the servers"