#!/bin/bash

# Script to install and setup act for local CI testing
# Act allows running GitHub Actions locally: https://github.com/nektos/act

set -e

echo "Setting up act for local CI testing..."

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"

# Install act based on OS
if [[ "$OS" == "Darwin" ]]; then
    # macOS
    if command -v brew &> /dev/null; then
        echo "Installing act via Homebrew..."
        brew install act
    else
        echo "Homebrew not found. Please install act manually from https://github.com/nektos/act"
        exit 1
    fi
elif [[ "$OS" == "Linux" ]]; then
    # Linux
    echo "Installing act for Linux..."
    
    # Determine architecture
    if [[ "$ARCH" == "x86_64" ]]; then
        ACT_ARCH="x86_64"
    elif [[ "$ARCH" == "aarch64" ]]; then
        ACT_ARCH="arm64"
    else
        echo "Unsupported architecture: $ARCH"
        exit 1
    fi
    
    # Download latest act release
    LATEST_VERSION=$(curl -s https://api.github.com/repos/nektos/act/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    DOWNLOAD_URL="https://github.com/nektos/act/releases/download/${LATEST_VERSION}/act_Linux_${ACT_ARCH}.tar.gz"
    
    echo "Downloading act ${LATEST_VERSION}..."
    curl -L -o /tmp/act.tar.gz "$DOWNLOAD_URL"
    
    # Extract and install
    sudo tar xf /tmp/act.tar.gz -C /usr/local/bin act
    rm /tmp/act.tar.gz
    
    echo "act installed successfully!"
else
    echo "Unsupported OS: $OS"
    echo "Please install act manually from https://github.com/nektos/act"
    exit 1
fi

# Verify installation
if command -v act &> /dev/null; then
    echo "act version: $(act --version)"
else
    echo "Error: act installation failed"
    exit 1
fi

echo ""
echo "Setup complete! You can now run CI tests locally with:"
echo "  act                    # Run default job (test)"
echo "  act -l                 # List all jobs"
echo "  act -j build           # Run specific job"
echo "  act -W .github/workflows/ci.yml  # Run specific workflow"
echo ""
echo "For E2E tests specifically:"
echo "  act -j e2e --container-architecture linux/amd64"