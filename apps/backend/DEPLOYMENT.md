# Deployment Guide

This guide explains how to deploy the Personal Hub backend to Cloudflare Workers.

## Prerequisites

- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)
- Logged in to Cloudflare (`wrangler login`)

## Production Deployment

### 1. Database Setup

The production D1 database has already been created:
- Database Name: `personal-hub-prod`
- Database ID: `7b37b6d9-659a-4adc-a396-fa339c12c597`

### 2. Environment Variables

Production secrets are managed using Wrangler secrets. The following secrets need to be set:

```bash
# JWT Secret (already set with a secure random value)
wrangler secret put JWT_SECRET --env production

# OAuth Credentials (update with actual values when available)
wrangler secret put OAUTH_GITHUB_CLIENT_ID --env production
wrangler secret put OAUTH_GITHUB_CLIENT_SECRET --env production
wrangler secret put OAUTH_GOOGLE_CLIENT_ID --env production
wrangler secret put OAUTH_GOOGLE_CLIENT_SECRET --env production
```

### 3. Database Migrations

Run migrations on the production database:

```bash
# Generate new migrations (if schema changed)
npx drizzle-kit generate

# Apply migrations to production
wrangler d1 execute personal-hub-prod --file=migrations/[migration-file].sql --env=production --remote
```

### 4. Deploy to Production

```bash
# Deploy to production environment
wrangler deploy --env production
```

The application will be available at: https://personal-hub-backend-prod.zametech.workers.dev

### 5. Verify Deployment

Test the deployment:

```bash
# Health check
curl https://personal-hub-backend-prod.zametech.workers.dev/health

# API endpoints
curl https://personal-hub-backend-prod.zametech.workers.dev/api/v1/auth/register
```

## Development Deployment

For local development:

```bash
# Run locally with development database
wrangler dev

# Deploy to development environment
wrangler deploy --env development
```

## Monitoring

View logs from production:

```bash
wrangler tail personal-hub-backend-prod --format pretty
```

## Rollback

To rollback to a previous version:

```bash
# List deployments
wrangler deployments list --env production

# Rollback to specific version
wrangler rollback [deployment-id] --env production
```

## API Endpoints

All API endpoints are prefixed with `/api/v1`:

- Auth: `/api/v1/auth/*`
- Todos: `/api/v1/todos/*`
- Goals: `/api/v1/goals/*`
- Events: `/api/v1/events/*`
- Notes: `/api/v1/notes/*`
- And more...

## Troubleshooting

If you encounter errors:

1. Check logs: `wrangler tail personal-hub-backend-prod --format pretty`
2. Verify database migrations were applied
3. Ensure all required secrets are set
4. Check that the D1 database binding is correct in wrangler.toml