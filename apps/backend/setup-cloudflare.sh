#!/bin/bash

# Setup script for Cloudflare resources
# This script creates the necessary KV namespaces for the application

echo "Setting up Cloudflare resources..."

# Create development KV namespace if it doesn't exist
echo "Creating development KV namespace..."
DEV_KV_RESULT=$(npx wrangler kv namespace create "RATE_LIMITER" --env development 2>&1)
if [[ $DEV_KV_RESULT == *"Success!"* ]]; then
  DEV_KV_ID=$(echo "$DEV_KV_RESULT" | grep -oP 'id = "\K[^"]+')
  echo "Development KV namespace created with ID: $DEV_KV_ID"
  echo "Please update the development KV namespace ID in wrangler.toml"
else
  echo "Development KV namespace may already exist or creation failed"
fi

# Create production KV namespace if it doesn't exist
echo "Creating production KV namespace..."
PROD_KV_RESULT=$(npx wrangler kv namespace create "RATE_LIMITER" --env production 2>&1)
if [[ $PROD_KV_RESULT == *"Success!"* ]]; then
  PROD_KV_ID=$(echo "$PROD_KV_RESULT" | grep -oP 'id = "\K[^"]+')
  echo "Production KV namespace created with ID: $PROD_KV_ID"
  echo "Please update the production KV namespace ID in wrangler.toml"
else
  echo "Production KV namespace may already exist or creation failed"
fi

echo ""
echo "Next steps:"
echo "1. Update the KV namespace IDs in wrangler.toml if new namespaces were created"
echo "2. Set the following secrets in your Cloudflare Workers dashboard or via wrangler secret:"
echo "   - JWT_SECRET (production value)"
echo "   - OAUTH_GITHUB_CLIENT_ID"
echo "   - OAUTH_GITHUB_CLIENT_SECRET"
echo "   - OAUTH_GOOGLE_CLIENT_ID"
echo "   - OAUTH_GOOGLE_CLIENT_SECRET"
echo ""
echo "To set secrets via wrangler:"
echo "  npx wrangler secret put JWT_SECRET --env production"
echo "  npx wrangler secret put OAUTH_GITHUB_CLIENT_ID --env production"
echo "  npx wrangler secret put OAUTH_GITHUB_CLIENT_SECRET --env production"
echo "  npx wrangler secret put OAUTH_GOOGLE_CLIENT_ID --env production"
echo "  npx wrangler secret put OAUTH_GOOGLE_CLIENT_SECRET --env production"