# Quick Start Guide

Get up and running with Personal Hub in 5 minutes.

## Prerequisites

- Node.js 20+
- pnpm 10.13.1
- Git
- Cloudflare account (optional, for deployment)

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/personal-hub-cf.git
cd personal-hub-cf

# 2. Install dependencies
pnpm install

# 3. Set up environment variables (if needed)
cd apps/backend
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your JWT secret if not using the dev-only default
cd ../..

# 4. Start development servers (frontend + backend)
pnpm dev
```

The application will be available at:
- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:8787>

## Using the Application

### Via Web Interface
1. Open <http://localhost:5173> in your browser
2. Click "Register" to create a new account
3. Log in with your credentials
4. Explore features:
   - Press `Cmd/Ctrl + K` to open the Command Palette
   - Use keyboard shortcuts (e.g., `Alt + T` for Todos)
   - Create tasks, notes, and track your productivity

### Via API
```bash
# 1. Register a new user
curl -X POST http://localhost:8787/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "username": "testuser"
  }'

# 2. The response will include access and refresh tokens
# Use the access token for authenticated requests
#
# IMPORTANT: Replace <ACCESS_TOKEN> with the access token from step 2.
# Do not paste real tokens into shared logs or screenshots.

# 3. Create your first todo
curl -X POST http://localhost:8787/api/v1/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "title": "My first todo",
    "priority": "HIGH"
  }'
```

## Running Tests

```bash
# Run unit tests
pnpm test

# Run unit tests with coverage
pnpm test:coverage

# Run E2E tests headless (default)
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run E2E tests in CI mode
pnpm test:ci

# Watch mode for development
pnpm test:watch
```

## Common Commands

```bash
# Development
pnpm dev           # Start both frontend and backend
pnpm build         # Build for production
pnpm typecheck     # Run TypeScript checks
pnpm lint          # Run ESLint

# Database commands (run from apps/backend)
pnpm db:generate   # Generate migration from schema
pnpm db:migrate    # Apply migrations locally
pnpm db:studio     # Open Drizzle Studio

# Deployment
pnpm deploy        # Deploy to Cloudflare Workers

# Quality checks (run before committing)
pnpm typecheck && pnpm lint && pnpm test
```

## Project Structure

```text
personal-hub-cf/
├── apps/
│   ├── backend/          # Cloudflare Workers API
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── middleware/ # Auth, CSRF, rate limiting
│   │   │   ├── db/       # Database schema (Drizzle)
│   │   │   └── utils/    # Helpers
│   │   └── wrangler.toml # Cloudflare config
│   └── frontend/         # React + Vite app
│       ├── src/
│       │   ├── components/ # UI components
│       │   ├── pages/     # Page components
│       │   ├── contexts/  # React contexts
│       │   └── lib/       # API clients
│       └── vite.config.ts
├── e2e/                  # Playwright E2E tests
└── docs/                 # Documentation
```

## Next Steps

1. Explore the [API documentation](../05-api/README.md)
2. Check out the [TypeScript types](../05-api/types.ts)
3. Review the [testing guide](../06-testing/README.md)
4. Learn about [deployment](../04-deployment/DEPLOYMENT.md)