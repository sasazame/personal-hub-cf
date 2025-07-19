# Deployment Guide

This guide explains how to deploy the Personal Hub application to Cloudflare.

## Prerequisites

1. Cloudflare account with:
   - Workers & Pages enabled
   - D1 database access
   - API token with appropriate permissions

2. GitHub repository with secrets configured:
   - `CLOUDFLARE_API_TOKEN` - Required for both Actions workflows
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
   - `GITHUB_TOKEN` - Automatically provided by GitHub Actions (no setup needed)
   
   **Important**: The deployment workflows will fail with "Input required and not supplied: apiToken" if these secrets are not configured in your repository settings under Settings → Secrets and variables → Actions.

## Environment Setup

### 1. Create D1 Databases

```bash
# Production database
wrangler d1 create personal-hub-production

# Staging database
wrangler d1 create personal-hub-staging
```

### 2. Update Configuration

1. Update `apps/backend/wrangler.toml` with production database ID
2. Update `apps/backend/wrangler.staging.toml` with staging database ID

### 3. Run Migrations

```bash
# Production
cd apps/backend
wrangler d1 migrations apply personal-hub-production

# Staging
wrangler d1 migrations apply personal-hub-staging --env staging
```

### 4. Configure Secrets

For both production and staging:

```bash
# Production secrets
wrangler secret put AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET

# Staging secrets (add --env staging flag)
wrangler secret put AUTH_SECRET --env staging
# ... repeat for other secrets
```

## Deployment Process

### Automatic Deployment

1. **Production**: Merging to `main` branch triggers automatic deployment
2. **Staging**: Opening/updating PR triggers preview deployment

### Manual Deployment

```bash
# Deploy frontend
cd apps/frontend
pnpm build

# Verify build directory exists
test -d dist || { echo "Build directory not found. Run 'pnpm build' first."; exit 1; }

# Deploy to Pages (specify branch for consistency)
wrangler pages deploy dist --project-name personal-hub-frontend --branch main

# Deploy backend
cd apps/backend
wrangler deploy --minify

# Deploy to staging
wrangler deploy --env staging --minify
```

## Performance Optimizations Implemented

1. **Code Splitting**: Components are lazy-loaded on demand
2. **Vendor Chunking**: Dependencies split into logical chunks
3. **PWA Support**: Service worker for offline functionality
4. **Cache Headers**: Optimized caching for static assets
5. **Bundle Size**: Reduced from 992KB to 251KB (75% reduction)

## Monitoring

1. Check Cloudflare Workers dashboard for:
   - Request counts
   - Error rates
   - Performance metrics

2. Use Cloudflare Analytics for:
   - Page views
   - Web Vitals
   - User geography

## Rollback Procedure

If issues occur:

1. Revert the problematic commit
2. Push to trigger new deployment
3. Or use Cloudflare dashboard to rollback to previous version

## Environment Variables

### Frontend (via Vite)
- `VITE_API_URL`: Backend API URL (automatically set in CI/CD)

### Backend (via wrangler.toml)
- `ENVIRONMENT`: "production" or "staging"
- Plus all secrets mentioned above