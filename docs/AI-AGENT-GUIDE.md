# AI Agent Quick Start Guide

## Repository Overview
Personal Hub - A full-stack web application with:
- **Frontend**: React + TypeScript + Vite (port 3000)
- **Backend**: Cloudflare Workers + Hono + D1 Database (port 8787)
- **Monorepo**: pnpm workspaces

## Essential Commands

### Initial Setup
```bash
# Install dependencies
pnpm install

# Start development servers
pnpm run dev
```

### Quality Checks (Run before committing)
```bash
# Frontend
cd apps/frontend
npm run typecheck
npm run lint

# Backend  
cd apps/backend
npm test

# Build
cd /path/to/project/root
npm run build

# E2E Tests (quick subset)
npm run test:e2e:quick
```

## Common Fix Patterns

### Frontend 404/Error Suppression
- Location: `apps/frontend/src/lib/api-client.ts`
- Pattern: Add to `EXPECTED_404_ENDPOINTS` array for expected 404s

### Backend Database Issues
- Schema: `apps/backend/src/db/schema.ts`
- Migrations: `apps/backend/migrations/`
- Add unique constraints or modify token generation for duplicate key errors

### E2E Test Failures
- Test files: `e2e/*.spec.ts`
- Common issue: Race conditions with authentication
- Solution: Add unique identifiers (timestamps, UUIDs) to prevent conflicts

## Project Structure
```text
apps/
  frontend/         # React app
  backend/          # Cloudflare Workers API
packages/
  shared/          # Shared types/constants
  ui/              # UI components
e2e/               # Playwright tests
```

## Key Configuration Files
- `apps/frontend/.env` - Frontend environment variables
- `apps/backend/.dev.vars` - Backend development variables
- `playwright.config.ts` - E2E test configuration

## Debugging Tips
1. Check browser console for API errors
2. Backend logs: Look for `[wrangler:info]` in terminal
3. Database issues: Check for UNIQUE constraints in error messages
4. Use `git status` frequently to track changes

## Creating PRs
```bash
# Create feature branch
git checkout -b fix/your-issue-name

# After changes
git add -A
git commit -m "fix: description" -m "Details here"

# Push and create PR
git push -u origin fix/your-issue-name
gh pr create --title "fix: your title" --body "Description"
```

## Important Notes
- Always run quality checks before committing
- The backend uses JWT tokens with 15-minute access tokens and 7-day refresh tokens
- Frontend polls `/api/v1/pomodoro/sessions/active` every second (expected 404s when no session)
- Use English for all code, comments, and commit messages