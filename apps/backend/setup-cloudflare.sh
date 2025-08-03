#!/usr/bin/env bash
set -euo pipefail

# Setup script for Cloudflare resources
# This script creates the necessary KV namespaces for the application

echo "=================================================="
echo "SECURITY WARNING: Secret Management Best Practices"
echo "=================================================="
echo "1. NEVER commit real secrets to version control"
echo "2. Use .dev.vars for development (already gitignored)"
echo "3. Use 'wrangler secret' for production secrets"
echo "4. Ensure .dev.vars is in .gitignore before adding any secrets"
echo "=================================================="
echo ""
echo "Setting up Cloudflare resources..."

# Create development KV namespace if it doesn't exist
echo "Creating development KV namespace..."
DEV_KV_RESULT=$(npx wrangler kv namespace create "RATE_LIMITER" --env development 2>&1)
if [[ $DEV_KV_RESULT == *"Success!"* ]]; then
  DEV_KV_ID=$(echo "$DEV_KV_RESULT" | grep -oE 'id = "[^"]+"' | cut -d'"' -f2)
  echo "Development KV namespace created with ID: $DEV_KV_ID"
  echo "Please update the development KV namespace ID in wrangler.toml"
else
  echo "Development KV namespace may already exist or creation failed"
fi

# Create production KV namespace if it doesn't exist
echo "Creating production KV namespace..."
PROD_KV_RESULT=$(npx wrangler kv namespace create "RATE_LIMITER" --env production 2>&1)
if [[ $PROD_KV_RESULT == *"Success!"* ]]; then
  PROD_KV_ID=$(echo "$PROD_KV_RESULT" | grep -oE 'id = "[^"]+"' | cut -d'"' -f2)
  echo "Production KV namespace created with ID: $PROD_KV_ID"
  echo "Please update the production KV namespace ID in wrangler.toml"
else
  echo "Production KV namespace may already exist or creation failed"
fi

echo ""
echo "=================================================="
echo "Next steps:"
echo "=================================================="
echo ""
echo "1. Update the KV namespace IDs in wrangler.toml if new namespaces were created"
echo ""
echo "2. For DEVELOPMENT secrets:"
echo "   Create or update the .dev.vars file with your development secrets:"
echo "   JWT_SECRET=your-dev-jwt-secret"
echo "   OAUTH_GITHUB_CLIENT_ID=your-dev-github-client-id"
echo "   OAUTH_GITHUB_CLIENT_SECRET=your-dev-github-client-secret"
echo "   OAUTH_GOOGLE_CLIENT_ID=your-dev-google-client-id"
echo "   OAUTH_GOOGLE_CLIENT_SECRET=your-dev-google-client-secret"
echo ""
echo "3. For PRODUCTION secrets (use strong, unique values):"
echo "   npx wrangler secret put JWT_SECRET --env production"
echo "   npx wrangler secret put OAUTH_GITHUB_CLIENT_ID --env production"
echo "   npx wrangler secret put OAUTH_GITHUB_CLIENT_SECRET --env production"
echo "   npx wrangler secret put OAUTH_GOOGLE_CLIENT_ID --env production"
echo "   npx wrangler secret put OAUTH_GOOGLE_CLIENT_SECRET --env production"
echo ""
echo "REMEMBER: Production secrets should be strong, unique values - never reuse development secrets!"