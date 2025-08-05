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

See [Deployment Guide](./docs/04-deployment/DEPLOYMENT.md) for detailed deployment instructions.

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
├── docs/                    # Organized documentation
│   ├── 01-getting-started/  # Quick start guides
│   ├── 02-architecture/     # System design docs
│   ├── 03-development/      # Development guides
│   ├── 04-deployment/       # Deployment instructions
│   ├── 05-api/              # API documentation
│   ├── 06-testing/          # Testing guides
│   ├── 07-migration/        # Migration documentation
│   └── 99-archive/          # Historical docs
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

- [Documentation Index](./docs/README.md) - Complete documentation overview
- [Quick Start Guide](./docs/01-getting-started/QUICK_START.md) - Get started quickly
- [API Reference](./docs/05-api/README.md) - Complete API documentation
- [Testing Guide](./docs/06-testing/README.md) - Testing strategies and guides
- [Migration Guide](./docs/07-migration/MIGRATION_GUIDE_V2.md) - Migration documentation

## 🌟 Features

- **Task Management**: Create, organize, and track todos with priorities and tags
- **Note Taking**: Rich text notes with categories and full-text search
- **Moments**: Capture quick thoughts and insights with tags
- **Event Calendar**: Schedule and manage events with reminders
- **Goal Tracking**: Set goals and monitor progress over time
- **Pomodoro Timer**: Focus sessions with integrated task tracking
- **Analytics Dashboard**: Productivity insights, habit tracking, and time analysis
- **User Management**: Profile settings and secure password management

## 🔒 Security Features

- **CSRF Protection**: Double-submit cookie pattern with secure SameSite attributes
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Session Management**: HTTP-only secure cookies with 30-minute inactivity timeout
- **Input Validation**: Comprehensive Zod-based validation on all endpoints
- **Secure Headers**: Security headers configured for XSS and clickjacking protection
- **Rate Limiting**: API rate limiting on authentication endpoints

## 📄 License

MIT