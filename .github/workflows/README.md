# GitHub Actions Workflows

This directory contains the CI/CD workflows for the Personal Hub project.

## Workflows

### 1. CI (Continuous Integration)
**File**: `ci.yml`
**Triggers**: Push to main, Pull requests

This workflow runs on every push and pull request to ensure code quality:
- Type checking with TypeScript
- Linting with ESLint
- Unit tests with coverage
- Integration tests
- Build verification

### 2. Deploy
**File**: `deploy.yml`
**Triggers**: Push to main, Manual dispatch

Automatically deploys the backend to Cloudflare Workers when changes are pushed to main:
- Runs tests before deployment
- Deploys to production environment
- Verifies deployment with health check
- TODO: Frontend deployment (pending migration)

### 3. Database Migration
**File**: `db-migration.yml`
**Triggers**: Manual dispatch only

Allows manual execution of database migrations:
- Generates new migrations if schema changed
- Runs migrations on specified environment
- Supports running specific migration files
- Safe for production use

## Required Secrets

The following secrets need to be configured in GitHub repository settings:

- `CLOUDFLARE_API_TOKEN`: API token with permissions to deploy Workers and manage D1 databases
  - Required scopes: Workers Scripts Write, D1 Write

## Setting up Cloudflare API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create a new token with the following permissions:
   - Account: Cloudflare Workers Scripts:Edit
   - Account: D1:Edit
   - Zone: Worker Routes:Edit (if using custom domains)
3. Add the token as `CLOUDFLARE_API_TOKEN` in GitHub Secrets

## Local Testing

You can test workflows locally using [act](https://github.com/nektos/act):

```bash
# Test CI workflow
act -W .github/workflows/ci.yml

# Test deployment (dry run)
act -W .github/workflows/deploy.yml --secret-file .env.secrets
```

## Monitoring

- Check workflow runs: https://github.com/[your-repo]/actions
- Production logs: `wrangler tail personal-hub-backend-prod --format pretty`
- Health check: https://personal-hub-backend-prod.zametech.workers.dev/health