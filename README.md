# Personal Hub - Cloudflare Migration

A modern, edge-native personal productivity hub built on Cloudflare's platform, featuring task management, note-taking, goal tracking, and analytics.

## 🚧 Migration Status

This project is a careful migration from the original Spring Boot + Next.js architecture to a Cloudflare-native stack. See [MIGRATION_GUIDE_V2.md](./MIGRATION_GUIDE_V2.md) for the detailed migration strategy.

## ✅ Project Status

**Completed:**
- ✅ Backend API migration with 100% Spring Boot compatibility
- ✅ D1 database schema fully migrated
- ✅ All 13 API endpoint groups implemented
- ✅ Authentication system with JWT tokens
- ✅ Comprehensive test suite (93.44% coverage, 243 tests passing)
- ✅ Production deployment complete
- ✅ CI/CD pipeline with GitHub Actions
- ✅ API documentation (OpenAPI 3.0)

**In Progress:**
- 🚧 File structure organization
- 🚧 Frontend migration planning

**Next Steps:**
- 📋 Extract shared UI components
- 📋 Migrate frontend incrementally
- 📋 Set up E2E tests

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
│   ├── backend/              # Cloudflare Workers API
│   │   ├── src/
│   │   │   ├── api/         # API types and specifications
│   │   │   ├── config/      # Configuration constants
│   │   │   ├── db/          # Database schema (Drizzle)
│   │   │   ├── middleware/  # Auth middleware
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── utils/       # Utilities and helpers
│   │   │   └── __tests__/   # Comprehensive test suite
│   │   └── wrangler.toml    # Cloudflare configuration
│   └── frontend/            # Next.js frontend (to be migrated)
├── docs/
│   ├── api/                 # API documentation
│   │   ├── README.md        # Quick API reference
│   │   ├── openapi.yaml     # OpenAPI 3.0 specification
│   │   ├── types.ts         # TypeScript definitions
│   │   └── client-example.ts # API client implementation
│   └── guides/              # Development guides
└── packages/                # Shared packages (future)
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Cloudflare Workers
- **Framework**: Hono (lightweight web framework)
- **Database**: Cloudflare D1 (SQLite-compatible edge database)
- **ORM**: Drizzle ORM
- **Authentication**: JWT with @tsndr/cloudflare-worker-jwt
- **Validation**: Zod
- **Testing**: Vitest with Miniflare
- **Coverage**: 93.44% statement coverage

### Frontend (To be migrated)
- **Framework**: Next.js 14
- **UI**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API

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

### API Documentation
- [API Quick Reference](./docs/api/README.md) - Concise API endpoint reference
- [OpenAPI Specification](./docs/api/openapi.yaml) - Complete API specification
- [TypeScript Types](./docs/api/types.ts) - Type definitions for frontend use
- [API Client Example](./docs/api/client-example.ts) - Implementation example

### Development Guides
- [Migration Guide V2](./MIGRATION_GUIDE_V2.md) - Detailed migration strategy
- [Migration Progress](./MIGRATION_PROGRESS.md) - Current migration status
- [Backend Documentation](./apps/backend/README.md) - Workers backend details

## 🌟 Features

- **Task Management**: Create, organize, and track todos with priorities and tags
- **Note Taking**: Rich text notes with categories and full-text search
- **Moments**: Capture quick thoughts and insights with tags
- **Event Calendar**: Schedule and manage events with reminders
- **Goal Tracking**: Set goals and monitor progress over time
- **Pomodoro Timer**: Focus sessions with integrated task tracking
- **Analytics Dashboard**: Productivity insights, habit tracking, and time analysis
- **User Management**: Profile settings and secure password management

## 📄 License

MIT