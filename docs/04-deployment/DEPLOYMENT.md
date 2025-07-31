# Deployment Guide

This guide covers the deployment setup for Personal Hub on Cloudflare infrastructure.

## Prerequisites

- Cloudflare account with Workers and Pages enabled
- GitHub repository with Actions enabled
- Required API tokens and credentials

## GitHub Secrets Configuration

The following secrets must be configured in your GitHub repository settings under Settings → Secrets and variables → Actions:

### Required Secrets

1. **CLOUDFLARE_API_TOKEN**
   - Create at: https://dash.cloudflare.com/profile/api-tokens
   - Required permissions:
     - Account: Cloudflare Workers Scripts:Edit
     - Account: Account Settings:Read
     - Zone: Page Rules:Edit
     - Zone: Workers Routes:Edit
   - Template: "Edit Cloudflare Workers" template works well

2. **CLOUDFLARE_ACCOUNT_ID**
   - Find in Cloudflare dashboard → Right sidebar
   - Format: 32-character alphanumeric string

### Setting up Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the exact name listed above

## Cloudflare Setup

### 1. D1 Database

Create the production database:

```bash
# Create production database
wrangler d1 create personal-hub-prod

# Create staging database (optional)
wrangler d1 create personal-hub-staging
```

Update `wrangler.toml` with the database IDs returned from the commands above.

### 2. Workers Configuration

The backend Worker is configured in `apps/backend/wrangler.toml`. Key settings:

```toml
name = "personal-hub-backend"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "personal-hub-prod"
database_id = "YOUR_DATABASE_ID"

[env.production]
name = "personal-hub-backend-prod"
```

### 3. Pages Configuration

Cloudflare Pages will be automatically configured when the first deployment runs. The project name is set to `personal-hub` in the GitHub Actions workflow.

## Deployment Process

### Automatic Deployment

Deployments are triggered automatically on push to the `main` branch:

1. **Backend (Workers)**: Deployed first
2. **Frontend (Pages)**: Deployed after backend succeeds

### Manual Deployment

To deploy manually:

```bash
# Deploy backend
cd apps/backend
wrangler deploy --env production

# Deploy frontend (after Pages project exists)
cd apps/frontend
pnpm build
wrangler pages deploy dist --project-name=personal-hub
```

### First-time Setup

1. Run the database migrations:
   ```bash
   # Go to GitHub Actions → Database Migration
   # Run workflow with "production" environment
   ```

2. Verify deployment:
   - Backend health: https://personal-hub-backend-prod.zametech.workers.dev/health
   - Frontend: https://personal-hub.pages.dev

## Environment URLs

### Production
- **Backend API**: https://personal-hub-backend-prod.zametech.workers.dev
- **Frontend**: https://personal-hub.pages.dev
- **Custom Domain**: Configure in Cloudflare Pages settings

### Staging (Optional)
- **Backend API**: https://personal-hub-backend-staging.zametech.workers.dev
- **Frontend**: https://staging.personal-hub.pages.dev

## Monitoring

### Health Checks
- Backend: `/health` endpoint
- Frontend: Check Pages deployment status in Cloudflare dashboard

### Logs
- Workers logs: Available in Cloudflare dashboard → Workers → Logs
- Pages logs: Available in deployment details

### Analytics
- Workers analytics: Built-in metrics in dashboard
- Pages analytics: Web Analytics can be enabled

## Troubleshooting

### Deployment Failures

1. **Authentication errors**: Check CLOUDFLARE_API_TOKEN permissions
2. **Build failures**: Check Node.js version and dependencies
3. **Runtime errors**: Check Workers logs for detailed errors

### Database Issues

1. **Migration failures**: Ensure D1 database exists and ID is correct
2. **Connection errors**: Verify database binding in wrangler.toml

### Pages Issues

1. **404 errors**: Check build output directory is `dist`
2. **API connection**: Verify VITE_API_BASE_URL is set correctly

## Security Considerations

1. **API Token**: Use minimum required permissions
2. **Secrets**: Never commit secrets to repository
3. **CORS**: Backend configures CORS for production domain
4. **Authentication**: JWT tokens expire after 24 hours

## Cost Optimization

1. **Workers**: Free tier includes 100,000 requests/day
2. **D1**: Free tier includes 5GB storage, 5M rows read/day
3. **Pages**: Unlimited sites, 500 builds/month free

## Rollback Process

### Backend Rollback
```bash
# List deployments
wrangler deployments list

# Rollback to specific version
wrangler rollback [deployment-id]
```

### Frontend Rollback
- Use Cloudflare Pages dashboard → Deployments → Rollback

## Maintenance

### Regular Tasks
1. Monitor error rates and performance
2. Review and rotate API tokens quarterly
3. Update dependencies monthly
4. Backup database before major updates

### Database Maintenance
```bash
# Export database
wrangler d1 export personal-hub-prod --output=backup.sql

# Import to new database
wrangler d1 execute personal-hub-prod --file=backup.sql
```