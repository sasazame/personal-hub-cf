# Personal Hub - Cloudflare Edition

A modern, edge-native personal productivity hub built on Cloudflare's infrastructure.

## Features

- ✅ **Todo Management** - Create, update, and organize your tasks
- ✅ **Goals Tracking** - Set and track progress on your goals
- 🚧 **Events Calendar** - Schedule and manage events
- 🚧 **Notes** - Markdown-powered note-taking
- 🚧 **Moments** - Quick thought capture
- 🚧 **Pomodoro Timer** - Time management and productivity tracking

## Tech Stack

### Backend
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1
- **ORM**: Drizzle ORM
- **Authentication**: Lucia Auth
- **Validation**: Zod

### Frontend
- **Framework**: React with Vite
- **State Management**: TanStack Query
- **Forms**: React Hook Form
- **Styling**: Tailwind CSS + Shadcn/ui
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/personal-hub-cf.git
cd personal-hub-cf
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up local development database:
```bash
cd apps/backend
wrangler d1 execute personal-hub-db --local --file=./migrations/0001_initial.sql
wrangler d1 execute personal-hub-db --local --file=./migrations/0002_goals.sql
```

4. Start development servers:
```bash
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8787

## Deployment

### Quick Setup

1. Configure GitHub repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

2. Run the database setup script:
```bash
./scripts/setup-databases.sh
```

3. Update database IDs in `apps/backend/wrangler.toml`

4. Push to main branch to trigger automatic deployment

For detailed deployment instructions, see [docs/deployment.md](docs/deployment.md).

## Development Workflow

### Branching Strategy

- `main` - Production-ready code
- Feature branches - All development work
- Pull requests required for merging to main

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `chore`: Maintenance tasks
- `test`: Test additions or changes

### Testing

```bash
# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

## Project Structure

```
personal-hub-cf/
├── apps/
│   ├── frontend/    # React SPA
│   └── backend/     # Hono API
├── packages/
│   ├── ui/          # Shared UI components
│   └── shared/      # Shared types and schemas
├── e2e/             # End-to-end tests
├── docs/            # Documentation
└── scripts/         # Utility scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the ISC License.