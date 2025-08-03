# Deployment Guide

## Environment Overview

This project uses two environments:

1. **Development** - Local development only
2. **Production** - Main branch deployments

**Note**: Preview deployments are disabled to conserve Cloudflare Pages build quota (500 builds/month on free plan).

## CORS Configuration

### Development
- Automatically allows `localhost` origins
- No rate limiting by default (KV namespace not required)

### Production
- Explicitly configured allowed origins in `wrangler.toml`
- Separate production database and KV namespace
- Strict rate limiting on authentication endpoints

## Rate Limiting

The application implements rate limiting on authentication endpoints:
- `/api/v1/auth/register`
- `/api/v1/auth/login`
- `/api/v1/auth/forgot-password`

**Limits**: 5 requests per 15 minutes per IP address

## Deployment Process

### Production Deployment
1. Merge PR to `main` branch
2. GitHub Actions automatically deploys:
   - Backend to Cloudflare Workers
   - Frontend to Cloudflare Pages

### Testing Before Production
1. Test all changes locally using development environment
2. Run full test suite: `pnpm test`
3. Run E2E tests: `pnpm e2e`
4. Create PR for code review
5. Merge to main only after approval

## Configuration Files

### Backend Configuration (`wrangler.toml`)
- Environment-specific settings
- Database and KV namespace bindings
- CORS allowed origins

### Frontend Configuration
- Uses `VITE_API_BASE_URL` environment variable
- Set during build process in GitHub Actions

## Troubleshooting

### CORS Errors
1. Check `ALLOWED_ORIGINS` in `wrangler.toml`
2. Ensure frontend is using correct `VITE_API_BASE_URL`
3. Verify wildcard patterns for preview environments

### Rate Limiting Issues
1. Check KV namespace is properly configured
2. Verify rate limiter binding in `wrangler.toml`
3. Monitor rate limit headers in API responses

### Build Quota Management
1. Monitor build usage in Cloudflare dashboard
2. Only deploy from main branch
3. Test thoroughly locally before merging
4. Consider upgrading to paid plan if more builds needed