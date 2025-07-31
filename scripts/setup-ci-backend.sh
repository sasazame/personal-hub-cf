#!/bin/bash

# Script to set up backend for CI tests
# Creates database, runs migrations, and starts backend server

set -e

echo "Setting up CI backend..."

# Ensure we're in the backend directory
cd apps/backend

# Create .wrangler directory structure if it doesn't exist
mkdir -p .wrangler/state/v3/d1

# Create empty SQLite database if it doesn't exist
DB_PATH=".wrangler/state/v3/d1/miniflare-D1DatabaseObject/4a2e0e90917a60f440055a113876a64cc891e97bb52c87b16b97dcb088fb5e2f.sqlite"
mkdir -p "$(dirname "$DB_PATH")"
if [ ! -f "$DB_PATH" ]; then
    echo "Creating local database..."
    touch "$DB_PATH"
fi

# Run migrations (skip if already applied)
echo "Running database migrations..."
pnpm wrangler d1 migrations apply personal-hub-local --local || echo "Some migrations may have already been applied"

# Start backend server
echo "Starting backend server..."
pnpm wrangler dev --local --test-scheduled --port 8787 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -f http://localhost:8787/health > /dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 1
done

# Export PID for cleanup
echo $BACKEND_PID > /tmp/backend.pid

# Set up trap to kill backend on exit
trap "kill $BACKEND_PID 2>/dev/null || true" EXIT

echo "Backend setup complete!"
echo "Backend PID: $BACKEND_PID"

# Keep script running if called directly
if [ "$1" = "--wait" ]; then
    wait $BACKEND_PID
fi