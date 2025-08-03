# Secret Management Guide

## Overview

This guide explains how to properly manage secrets for the Personal Hub backend application. We follow security best practices to ensure secrets are never exposed in version control.

## Development Environment

For local development, create a `.dev.vars` file in the `apps/backend` directory:

```bash
# apps/backend/.dev.vars
JWT_SECRET=your-dev-jwt-secret
OAUTH_GITHUB_CLIENT_ID=your-dev-github-client-id
OAUTH_GITHUB_CLIENT_SECRET=your-dev-github-client-secret
OAUTH_GOOGLE_CLIENT_ID=your-dev-google-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-dev-google-client-secret
```

**Important**: 
- The `.dev.vars` file is gitignored and should NEVER be committed
- Use development-specific values, not production secrets

## Production Environment

Production secrets are managed through Cloudflare's secret management:

```bash
# Set production secrets (run from apps/backend directory)
npx wrangler secret put JWT_SECRET --env production
npx wrangler secret put OAUTH_GITHUB_CLIENT_ID --env production
npx wrangler secret put OAUTH_GITHUB_CLIENT_SECRET --env production
npx wrangler secret put OAUTH_GOOGLE_CLIENT_ID --env production
npx wrangler secret put OAUTH_GOOGLE_CLIENT_SECRET --env production
```

### Generating a Secure JWT Secret

```bash
# Generate a secure random string
openssl rand -base64 32
```

## Initial Setup

Run the setup script to create necessary Cloudflare resources:

```bash
cd apps/backend
./setup-cloudflare.sh
```

This script will:
1. Create KV namespaces for rate limiting
2. Provide instructions for secret configuration
3. Display security warnings and best practices

## Security Best Practices

1. **Never commit secrets**: All secrets must be in `.dev.vars` or Cloudflare secrets
2. **Use strong secrets**: Production JWT_SECRET should be cryptographically random
3. **Separate environments**: Never use development secrets in production
4. **Rotate regularly**: Change production secrets every 90 days or immediately if compromised
5. **Limit access**: Only authorized team members should have access to production secrets

## Troubleshooting

### Missing Secrets Error
If you see errors about missing environment variables:
1. Ensure `.dev.vars` exists for local development
2. Verify production secrets are set: `npx wrangler secret list --env production`

### KV Namespace Errors
If you see "KV namespace not found" errors:
1. Run `./setup-cloudflare.sh` to create namespaces
2. Update `wrangler.toml` with the generated namespace IDs

## GitHub Actions

The deployment workflow uses these GitHub secrets:
- `CLOUDFLARE_API_TOKEN`: For deploying to Cloudflare
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

These are configured at the repository level, not in code.