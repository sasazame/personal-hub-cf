# Quick Start Guide

Get up and running with Personal Hub in 5 minutes.

## Prerequisites

- Node.js 20+
- pnpm 8+
- Git

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/personal-hub-cf.git
cd personal-hub-cf

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cd apps/backend
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your JWT secret

# 4. Run database migrations
pnpm db:migrate

# 5. Start development server
pnpm dev
```

The backend will be available at http://localhost:8787

## First API Call

```bash
# 1. Register a new user
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "username": "testuser"
  }'

# 2. The response will include access and refresh tokens
# Use the access token for authenticated requests

# 3. Create your first todo
curl -X POST http://localhost:8787/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "My first todo",
    "priority": "HIGH"
  }'
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Watch mode for development
pnpm test -- --watch
```

## Common Commands

```bash
# Database commands
pnpm db:generate    # Generate migration from schema
pnpm db:migrate     # Apply migrations locally
pnpm db:studio      # Open Drizzle Studio

# Development
pnpm dev           # Start dev server
pnpm typecheck     # Run TypeScript checks
pnpm lint          # Run ESLint

# Deployment
pnpm deploy        # Deploy to Cloudflare Workers
```

## Project Structure

```
apps/backend/
├── src/
│   ├── routes/      # API endpoints
│   ├── middleware/  # Auth middleware
│   ├── db/          # Database schema
│   └── utils/       # Helpers
├── .dev.vars        # Local env variables
└── wrangler.toml    # Cloudflare config
```

## Next Steps

1. Explore the [API documentation](../api/README.md)
2. Check out the [TypeScript types](../api/types.ts)
3. Review the [testing guide](./TESTING.md)
4. Learn about [deployment](./DEPLOYMENT.md)