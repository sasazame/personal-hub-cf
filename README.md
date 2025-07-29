# Personal Hub - Cloudflare

A modern, edge-native personal productivity hub built on Cloudflare's platform, featuring task management, note-taking, goal tracking, and analytics.

## ✅ Project Status

**Completed:**
- ✅ Backend API migration with 100% Spring Boot compatibility
- ✅ D1 database schema fully migrated
- ✅ All 13 API endpoint groups implemented
- ✅ Authentication system with JWT tokens
- ✅ Comprehensive test suite (93.44% coverage, 243 tests passing)
- ✅ CI/CD pipeline with GitHub Actions
- ✅ API documentation (OpenAPI 3.0)
- ✅ **Frontend migration from Next.js to Vite+React**
- ✅ **All main features implemented in new frontend**
- ✅ **E2E test suite with Playwright (32 test files)**

**In Progress:**
- 🚧 Cloudflare Pages deployment setup
- 🚧 E2E test stability improvements
- 🚧 OAuth integration (GitHub/Google)

**Next Steps:**
- 📋 Deploy to Cloudflare Pages for staging
- 📋 Implement missing OAuth flows
- 📋 Performance optimizations
- 📋 Dark mode toggle

## 📋 Prerequisites

- Node.js 20+
- pnpm 10.13.1
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

## 🌐 Deployment

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Links
- **Backend API**: https://personal-hub-backend-prod.zametech.workers.dev
- **Health Check**: https://personal-hub-backend-prod.zametech.workers.dev/health
- **Frontend**: https://personal-hub.pages.dev (after deployment)

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
│   └── frontend/            # React + Vite frontend
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   ├── contexts/    # React contexts
│       │   ├── hooks/       # Custom hooks
│       │   └── lib/         # API clients
│       └── vite.config.ts   # Vite configuration
├── e2e/                     # E2E test suite (Playwright)
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

### Frontend
- **Framework**: React with Vite
- **UI Library**: Material-UI (MUI)
- **Styling**: Tailwind CSS + Emotion
- **State Management**: React Query + Zustand
- **Calendar**: FullCalendar
- **Charts**: Recharts
- **Markdown**: React Markdown
- **Testing**: Playwright for E2E

## 📝 Migration Principles

1. **100% API Compatibility** - Backend maintains exact API contracts
2. **Incremental Migration** - Page-by-page frontend migration
3. **Continuous Validation** - Every change tested against original
4. **Feature Freeze** - No new features during migration

## 🧪 Testing Strategy

```bash
# Run unit tests
pnpm test

# Run E2E tests (requires dev servers running)
SKIP_WEBSERVER=1 E2E_BASE_URL=http://localhost:5173 pnpm playwright test

# Run CI-optimized tests
SKIP_WEBSERVER=1 E2E_BASE_URL=http://localhost:5173 pnpm playwright test e2e/ci.spec.ts

# Run tests with UI
pnpm test:e2e:ui
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