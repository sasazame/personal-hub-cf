# Personal Hub - Cloudflare

A modern, edge-native personal productivity hub built on Cloudflare's platform, featuring task management, note-taking, goal tracking, and analytics.

## ✅ Project Status

**Recently Completed (August 2025):**
- ✅ **Command Palette System** - Global keyboard shortcuts with Cmd/Ctrl+K
- ✅ **Dark Mode Improvements** - Semantic tokens and system theme support
- ✅ **Pomodoro Timer** - Full implementation with task integration
- ✅ **Security Event Logging** - Comprehensive audit trail system
- ✅ **Enhanced UI/UX** - Visual feedback improvements across all features
- ✅ **Bug Fixes** - CSRF token issues, note tags, E2E test reliability

**Core Infrastructure:**
- ✅ Backend API with 100% Spring Boot compatibility
- ✅ D1 database schema fully migrated (15+ tables)
- ✅ All 13 API endpoint groups implemented
- ✅ JWT Authentication with CSRF protection
- ✅ Comprehensive test suite (93.44% coverage, 279 tests)
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Frontend migration from Next.js to Vite+React
- ✅ E2E test suite with Playwright (32 test files)
- ✅ Internationalization (English/Japanese)

**In Progress:**
- 🚧 OAuth integration completion (GitHub/Google)
- 🚧 Cloudflare Pages deployment finalization
- 🚧 Performance optimizations

**Next Steps:**
- 📋 Complete OAuth implementation
- 📋 Add field-level encryption for sensitive data
- 📋 Implement backup and restore functionality
- 📋 Add more keyboard shortcuts

## 📋 Prerequisites

- Node.js 20+
- pnpm 10.13.1
- Cloudflare account (for deployment)
- Wrangler CLI (`npm install -g wrangler`)

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run all services in development
pnpm dev
# Frontend: http://localhost:5173
# Backend: http://localhost:8787

# Run specific workspace
pnpm --filter @personal-hub/backend dev
pnpm --filter @personal-hub/frontend dev

# Run tests
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests with UI
pnpm test:e2e:ci   # E2E tests headless

# Code quality checks
pnpm typecheck     # TypeScript validation
pnpm lint          # ESLint checks
pnpm build         # Production build
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
- **Runtime**: Cloudflare Workers (Edge computing)
- **Framework**: Hono (lightweight web framework)
- **Database**: Cloudflare D1 (SQLite-compatible edge database)
- **ORM**: Drizzle ORM with type-safe queries
- **Authentication**: JWT with @tsndr/cloudflare-worker-jwt
- **Validation**: Zod schemas for all endpoints
- **Rate Limiting**: Cloudflare KV for distributed rate limiting
- **Testing**: Vitest with Miniflare for edge environment
- **Coverage**: 93.44% statement coverage (279 tests)

### Frontend
- **Framework**: React 18 with Vite for fast HMR
- **UI Components**: Custom components with Tailwind CSS
- **Styling**: Tailwind CSS with semantic design tokens
- **State Management**: React Query + Context API
- **Calendar**: FullCalendar with event management
- **Charts**: Recharts for analytics visualization
- **Markdown**: React Markdown for rich text
- **Icons**: React Icons library
- **Testing**: Playwright for E2E (32 test files)
- **Performance**: Virtual scrolling, lazy loading, memoization

## 🔄 Development Workflow

### Branch Strategy
- **main** - Production-ready code
- **feat/** - New features
- **fix/** - Bug fixes
- **docs/** - Documentation updates

### Commit Guidelines
- Use conventional commits (feat:, fix:, docs:, etc.)
- Include `[skip ci]` for documentation-only changes
- Reference issues when applicable

### Pull Request Process
1. Create feature branch from main
2. Make changes with proper testing
3. Ensure all quality checks pass
4. Create PR with detailed description
5. Wait for CI checks and review
6. Merge after approval

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

### Core Productivity Features
- **📝 Task Management**: Advanced todo system with priorities (Low/Medium/High/Urgent), statuses (Todo/In Progress/Done/Cancelled), recurring tasks (Daily/Weekly/Monthly/Yearly), and subtask hierarchy
- **📔 Note Taking**: Rich text notes with tags, full-text search, and organization
- **💭 Moments**: Quick capture for thoughts and insights with tag categorization
- **📅 Event Calendar**: Full-featured calendar with reminders and Google Calendar integration ready
- **🎯 Goal Tracking**: Set goals, track achievements, and monitor progress over time
- **🍅 Pomodoro Timer**: Advanced timer with task integration, customizable work/break durations, cycle tracking, audio alerts, auto-start options, and session history
- **📊 Analytics Dashboard**: Comprehensive insights including completion rates, productivity streaks, hourly/weekly patterns, tag analytics, goal progress tracking, and activity heatmaps

### User Experience Features
- **⌨️ Command Palette**: Global keyboard shortcuts (Cmd/Ctrl+K) with fuzzy search, command history, categories, and virtual scrolling for 1000+ commands
- **🌓 Theme System**: Light, dark, and system theme support with semantic design tokens and CSS variables
- **🌐 Internationalization**: Full English and Japanese language support with namespaced translations
- **📱 Responsive Design**: Mobile-friendly interface with touch support and responsive layouts
- **⚡ Performance**: Virtual scrolling, lazy loading, memoization, search caching (99% faster), and optimized rendering
- **♿ Accessibility**: Comprehensive ARIA attributes, keyboard navigation, focus management, and screen reader support

### Advanced Features
- **🔄 Recurring Tasks**: Complex repeat patterns with custom intervals and specific days/dates
- **🏗️ Feature Toggles**: User-configurable feature enablement for personalized experience
- **📡 Google Calendar Ready**: Database schema and API endpoints prepared for calendar sync
- **🏷️ Tag Analytics**: Cross-feature tag analysis for notes and moments
- **📦 Session Storage**: Sophisticated session management with timeout handling
- **📝 Audit Trail**: Comprehensive security event logging for compliance

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Session Management**: HTTP-only secure cookies with 30-minute inactivity timeout
- **CSRF Protection**: Double-submit cookie pattern with secure SameSite attributes
- **Security Event Logging**: Comprehensive audit trail for all security events
- **Input Validation**: Comprehensive Zod-based validation on all endpoints
- **SQL Injection Protection**: Parameterized queries through Drizzle ORM
- **XSS Prevention**: Content sanitization and secure headers
- **Rate Limiting**: API rate limiting on authentication endpoints using Cloudflare KV
- **Password Security**: Secure hashing with salt for password storage

## 📄 License

MIT