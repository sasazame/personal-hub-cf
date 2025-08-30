# Personal Hub

[![CI Status](https://github.com/sasazame/personal-hub-cf/actions/workflows/ci.yml/badge.svg)](https://github.com/sasazame/personal-hub-cf/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020)](https://workers.cloudflare.com/)

A modern, privacy-focused personal productivity hub built on Cloudflare's edge platform. Manage tasks, notes, goals, and track your productivity with advanced analytics - all with zero vendor lock-in and complete data ownership.

## 🎯 Why Personal Hub?

Unlike traditional productivity apps that lock your data in proprietary formats or require expensive subscriptions, Personal Hub gives you:

- **Complete Data Ownership**: Your data stays in your Cloudflare account
- **Edge-Native Performance**: Sub-50ms response times globally via Cloudflare's network
- **Privacy First**: No telemetry, no tracking, your data never leaves your control
- **Zero Vendor Lock-in**: Export all data anytime, self-host anywhere
- **Cost Effective**: Runs on Cloudflare's generous free tier for personal use

## ✨ Features

### Core Productivity
- **📝 Advanced Task Management** - Priorities, recurring tasks, subtasks, and smart scheduling
- **📔 Rich Notes** - Markdown support, tags, full-text search, and organization
- **🎯 Goal Tracking** - Set objectives, track progress, celebrate achievements
- **📅 Smart Calendar** - Event management with reminders and integration capabilities
- **🍅 Pomodoro Timer** - Stay focused with customizable work sessions
- **💭 Moments** - Quick capture for thoughts and ideas with instant tagging

### Intelligence & Analytics
- **📊 Productivity Analytics** - Detailed insights into your work patterns
- **📈 Progress Tracking** - Visualize goal completion and task trends
- **🔥 Streak Tracking** - Build and maintain productive habits
- **📍 Activity Heatmaps** - Understand your productivity patterns

### User Experience
- **⌨️ Command Palette** - Navigate anywhere with Cmd/Ctrl+K
- **🌓 Theme Support** - Light, dark, and system-aware themes
- **🌐 i18n Support** - English and Japanese (more languages welcome!)
- **📱 Responsive Design** - Works seamlessly on all devices
- **♿ Accessibility** - WCAG compliant with full keyboard navigation

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and pnpm
- Cloudflare account (free tier works)
- 5 minutes of your time

### Installation

```bash
# Clone the repository
git clone https://github.com/sasazame/personal-hub-cf.git
cd personal-hub-cf

# Install dependencies
pnpm install

# Set up your environment
cp apps/backend/.dev.vars.example apps/backend/.dev.vars
# Edit .dev.vars with your JWT secret

# Start development servers
pnpm dev
```

Visit `http://localhost:5173` and start being productive! 🎉

### Deploy to Production

```bash
# Deploy backend to Cloudflare Workers
pnpm --filter @personal-hub/backend deploy

# Deploy frontend to Cloudflare Pages
pnpm --filter @personal-hub/frontend build
pnpm --filter @personal-hub/frontend deploy
```

See [detailed deployment guide](./docs/04-deployment/DEPLOYMENT.md) for production configuration.

## 🛠️ Technology Stack

- **Backend**: Cloudflare Workers + Hono + D1 Database
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Testing**: Vitest + Playwright
- **CI/CD**: GitHub Actions
- **Type Safety**: TypeScript + Zod validation

## 📚 Documentation

- [Getting Started Guide](./docs/01-getting-started/README.md)
- [API Documentation](./docs/05-api/README.md)
- [Development Guide](./docs/03-development/README.md)
- [Testing Guide](./docs/06-testing/README.md)
- [Deployment Guide](./docs/04-deployment/DEPLOYMENT.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Run tests
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests

# Code quality
pnpm typecheck     # Type checking
pnpm lint          # Linting
pnpm format        # Formatting

# Build
pnpm build         # Production build
```

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes (use `[skip ci]` for docs-only)
- `chore:` Maintenance tasks
- `test:` Test improvements

## 🗺️ Roadmap

### Current Focus
- [ ] OAuth integration (GitHub, Google)
- [ ] Data export/import functionality
- [ ] Plugin system architecture

### Future Plans
- [ ] Mobile apps (React Native)
- [ ] Desktop app (Electron)
- [ ] AI-powered insights
- [ ] Team collaboration features
- [ ] WebDAV sync support

See [full roadmap](https://github.com/sasazame/personal-hub-cf/issues) for more details.

## 📊 Project Status

- **Core Features**: ✅ Complete
- **Testing**: ✅ 90%+ coverage
- **Documentation**: ✅ Comprehensive
- **Production Ready**: ✅ Yes
- **Active Development**: ✅ Yes

## 🔒 Security

- JWT-based authentication
- CSRF protection
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- Security event logging

For security issues, please open a private security advisory on GitHub or contact the maintainers directly through GitHub

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with amazing open source projects:
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Hono](https://hono.dev/)
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/)

## 💬 Community

- [Discussions](https://github.com/sasazame/personal-hub-cf/discussions)
- [Issues](https://github.com/sasazame/personal-hub-cf/issues)
- Discord - Coming soon!

---

<p align="center">
  Made with ❤️ by the Personal Hub community
</p>