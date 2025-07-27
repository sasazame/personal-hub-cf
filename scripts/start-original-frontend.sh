#!/bin/bash

# Start the original frontend for UI collection
echo "Starting original personal-hub frontend..."

# Check if the original frontend exists
if [ ! -d "/home/sasazame/git/personal-hub/personal-hub-frontend" ]; then
  echo "Error: Original frontend not found at /home/sasazame/git/personal-hub/personal-hub-frontend"
  exit 1
fi

# Change to original frontend directory
cd /home/sasazame/git/personal-hub/personal-hub-frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Kill any existing process on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start the frontend on port 3001 (to not conflict with our new frontend)
echo "Starting frontend on port 3001..."
PORT=3001 npm run dev > /tmp/original-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:3001 > /dev/null; then
    echo "Original frontend is ready on port 3001!"
    echo "PID: $FRONTEND_PID"
    exit 0
  fi
  if [ $i -eq 30 ]; then
    echo "Frontend failed to start. Check /tmp/original-frontend.log"
    cat /tmp/original-frontend.log
    exit 1
  fi
  sleep 1
done