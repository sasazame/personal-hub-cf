#!/bin/bash

# Simple script to start backend for tests
set -e

cd apps/backend

# Run migrations first
echo "Running database migrations..."
pnpm wrangler d1 migrations apply personal-hub-local --local || echo "Migrations may have already been applied"

# Start backend and keep it running
echo "Starting backend server..."
pnpm wrangler dev --local --test-scheduled --port 8787