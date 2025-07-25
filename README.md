# Personal Hub - Cloudflare Migration

A modern, edge-native personal management system built on Cloudflare's platform.

## 🚧 Migration Status

This project is a careful migration from the original Spring Boot + Next.js architecture to a Cloudflare-native stack. See [MIGRATION_GUIDE_V2.md](./MIGRATION_GUIDE_V2.md) for the detailed migration strategy.

## Project Status

✅ **Completed:**
- Migration guide addressing previous failure points
- Monorepo structure with pnpm workspaces
- API compatibility testing framework  
- Cloudflare Workers backend with 100% API compatibility
- D1 database schema fully migrated
- All API endpoints implemented and tested
- Comprehensive test suite (87.63% coverage)
- Production deployment complete
- Authentication system with JWT tokens

🚧 **In Progress:**
- CI/CD pipeline setup
- Frontend migration planning

📋 **Next Steps:**
- Complete CI/CD pipeline with GitHub Actions
- Extract shared UI components
- Migrate frontend incrementally
- Set up E2E tests

## 📋 Prerequisites

- Node.js 18+
- pnpm 9+
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run all services in development
pnpm dev

# Run specific workspace
pnpm --filter @personal-hub/backend dev
pnpm --filter @personal-hub/frontend dev

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## 🌐 Production Deployment

The backend is deployed and accessible at:
- **API Endpoint**: https://personal-hub-backend-prod.zametech.workers.dev
- **Health Check**: https://personal-hub-backend-prod.zametech.workers.dev/health

All API endpoints are available under `/api/v1/*` prefix.

## 📁 Project Structure

```
personal-hub-cf/
├── apps/
│   ├── backend/          # Cloudflare Workers API (Hono)
│   ├── frontend/         # Cloudflare Pages SPA (React/Vite)
│   └── api-compat-test/  # API compatibility testing suite
├── packages/
│   ├── shared/           # Shared types, schemas (Zod)
│   ├── ui/               # Shared React components
│   └── api-client/       # Type-safe API client
├── tools/
│   ├── migration/        # Data migration utilities
│   └── api-compare/      # API comparison tools
└── docs/
    └── api-contracts/    # API documentation
```

## 🛠️ Technology Stack

- **Backend**: Cloudflare Workers + Hono
- **Frontend**: Cloudflare Pages + React/Vite
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Authentication**: Lucia Auth
- **Testing**: Vitest + Playwright
- **Build**: Turbo

## 📝 Migration Principles

1. **100% API Compatibility** - Backend maintains exact API contracts
2. **Incremental Migration** - Page-by-page frontend migration
3. **Continuous Validation** - Every change tested against original
4. **Feature Freeze** - No new features during migration

## 🧪 Testing Strategy

```bash
# Run API compatibility tests
pnpm --filter @personal-hub/api-compat-test test:compare

# Run unit tests
pnpm test

# Run E2E tests (coming soon)
pnpm e2e
```

## 📚 Documentation

- [Migration Guide V2](./MIGRATION_GUIDE_V2.md) - Detailed migration strategy
- [Migration Progress](./MIGRATION_PROGRESS.md) - Current migration status
- [API Compatibility Tests](./apps/api-compat-test/README.md) - Testing documentation
- [Backend Documentation](./apps/backend/README.md) - Workers backend details

## 📄 License

MIT