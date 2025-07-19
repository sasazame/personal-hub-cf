# Deployment Guide

This guide covers the deployment setup for the Personal Hub application on Cloudflare.

## Prerequisites

1. **Cloudflare Account**: You need a Cloudflare account with Workers and Pages enabled.
2. **GitHub Repository Secrets**: The following secrets must be configured in your GitHub repository settings:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with permissions for Workers and Pages
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

## Creating D1 Databases

Before deploying, you need to create D1 databases for staging and production environments.

### 1. Install Wrangler CLI (if not already installed)

```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

### 3. Create Production Database

```bash
wrangler d1 create personal-hub-db-production
```

Note the database ID from the output and update it in `apps/backend/wrangler.toml`:

```toml
[env.production]
name = "personal-hub-api-production"
[[env.production.d1_databases]]
binding = "DB"
database_name = "personal-hub-db-production"
database_id = "YOUR_PRODUCTION_DB_ID_HERE"  # Replace with actual ID
```

### 4. Create Staging Database

```bash
wrangler d1 create personal-hub-db-staging
```

Note the database ID from the output and update it in `apps/backend/wrangler.toml`:

```toml
[env.staging]
name = "personal-hub-api-staging"
[[env.staging.d1_databases]]
binding = "DB"
database_name = "personal-hub-db-staging"
database_id = "YOUR_STAGING_DB_ID_HERE"  # Replace with actual ID
```

### 5. Run Database Migrations

For each environment, run the migrations:

```bash
# Production
cd apps/backend
wrangler d1 migrations apply personal-hub-db-production --env production

# Staging
wrangler d1 migrations apply personal-hub-db-staging --env staging
```

## Deployment Workflow

### Automatic Deployments

The project uses GitHub Actions for automated deployments:

1. **Pull Request to main**: Automatically deploys to staging environment
2. **Push/Merge to main**: Automatically deploys to production environment after tests pass

### Manual Deployment

If you need to deploy manually:

#### Backend (Cloudflare Workers)

```bash
cd apps/backend

# Deploy to staging
pnpm deploy --env staging

# Deploy to production
pnpm deploy --env production
```

#### Frontend (Cloudflare Pages)

The frontend is automatically deployed via GitHub Actions. For manual deployment:

```bash
cd apps/frontend

# Build with production API URL
VITE_API_URL=https://personal-hub-api-production.workers.dev pnpm build

# Deploy using Wrangler Pages
wrangler pages deploy dist --project-name personal-hub-frontend
```

## Environment URLs

### Production
- Frontend: `https://personal-hub-frontend.pages.dev`
- Backend: `https://personal-hub-api-production.workers.dev`

### Staging
- Frontend: Preview deployments on pull requests
- Backend: `https://personal-hub-api-staging.workers.dev`

## Troubleshooting

### GitHub Actions Failing

1. **Check Secrets**: Ensure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set in repository settings
2. **Check Permissions**: Ensure the API token has permissions for Workers and Pages
3. **Check Logs**: Review the GitHub Actions logs for specific error messages

### Database Connection Issues

1. **Check Database IDs**: Ensure the database IDs in `wrangler.toml` match the actual database IDs
2. **Check Migrations**: Ensure all migrations have been applied
3. **Check Bindings**: Ensure the database binding name (`DB`) is consistent

### Authentication Issues

1. **Check Cookie Settings**: In development, cookies need `secure: false`
2. **Check CORS**: Ensure the frontend URL is allowed in the backend CORS configuration
3. **Check Session Management**: Verify Lucia Auth is properly configured

## Security Considerations

1. **API Token**: Never commit the Cloudflare API token to the repository
2. **Database IDs**: While not secret, avoid committing placeholder IDs
3. **Environment Variables**: Use GitHub Secrets for all sensitive configuration
4. **HTTPS**: All production traffic uses HTTPS by default on Cloudflare