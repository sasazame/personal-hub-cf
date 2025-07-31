#!/bin/bash

# Script to run E2E tests locally using act
# This simulates the GitHub Actions CI environment

set -e

echo "Running E2E tests locally with act..."

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo "Error: act is not installed."
    echo "Please run: ./scripts/setup-act.sh"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Error: Docker is not running."
    echo "Please start Docker and try again."
    exit 1
fi

# Run the E2E job from CI workflow
echo "Starting E2E tests..."
act -j e2e \
    --secret-file .env.act \
    -W .github/workflows/ci.yml \
    --container-architecture linux/amd64

echo "E2E tests completed!"