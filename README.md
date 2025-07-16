# personal-hub-cf

`personal-hub-cf` is a modern, edge-native full-stack application running on Cloudflare. It serves as a personal hub to manage daily tasks, goals, and notes, built with a focus on performance, developer experience, and end-to-end type safety.

This project is a migration of the original Personal Hub, re-architected to leverage the power of Cloudflare's edge network.

## Core Principles

- **TypeScript First:** End-to-end type safety from the database to the UI.
- **Edge Native:** All code (backend and frontend) is designed to run on Cloudflare's global edge network for minimal latency.
- **Developer Experience:** Fast, modern tooling to maximize productivity and code quality.

## Project Structure

This project is a monorepo managed by `pnpm` workspaces.

```
/personal-hub-cf/
├── apps/
│   ├── frontend/  # React SPA (Cloudflare Pages)
│   └── backend/   # Hono API (Cloudflare Workers)
├── packages/
│   ├── ui/        # Shared React components
│   └── shared/    # Shared code (Zod schemas, types)
├── pnpm-workspace.yaml
└── package.json
```

## Technical Stack

### Backend

- **Runtime:** Cloudflare Workers
- **Framework:** Hono
- **Database:** Cloudflare D1
- **ORM:** Drizzle ORM
- **Validation:** Zod
- **Authentication:** Lucia Auth (with bcryptjs for password hashing)
- **Deployment:** Wrangler CLI

### Frontend

- **Framework:** React
- **Build Tool:** Vite
- **Deployment:** Cloudflare Pages
- **Styling:** Tailwind CSS
- **Components:** Shadcn/ui
- **State Management:** TanStack Query (React Query)
- **Forms:** React Hook Form

### Shared Tooling

- **Testing:** Vitest (unit tests) & Playwright (E2E tests)
- **Linter:** ESLint
- **Formatter:** Prettier
- **CI/CD:** GitHub Actions

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (version specified in `.nvmrc`)
- [pnpm](https://pnpm.io/installation)
- [Cloudflare Account](https://dash.cloudflare.com/sign-up)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/personal-hub-cf.git
    cd personal-hub-cf
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

### Local Development

1.  **Set up environment variables:**
    Create a `.dev.vars` file in the `apps/backend` directory by copying the example file.
    ```bash
    cp apps/backend/.dev.vars.example apps/backend/.dev.vars
    ```
    Fill in the required secrets for authentication providers and database access.

2.  **Run the development servers:**
    This command will start the backend server and the frontend development server concurrently.
    ```bash
    pnpm dev
    ```
    
3.  **Run tests:**
    ```bash
    # Unit tests
    pnpm test
    
    # E2E tests
    pnpm test:e2e
    ```

## Development Workflow

This project follows the **GitHub Flow**. All work should be done in feature branches and merged into `main` via Pull Requests.

### Branch Protection

The `main` branch is protected with the following rules:
- Pull requests are required before merging
- One approving review is required
- All conversation threads must be resolved
- CI status checks must pass
- Commits must be signed

### Commits

We use the **Conventional Commits** specification. This allows for automated changelog generation and keeps the project history clean and readable.

**Format:** `<type>(<scope>): <subject>`

-   **Examples:**
    -   `feat(api): add user login endpoint`
    -   `fix(ui): correct button alignment`
    -   `docs(readme): update setup instructions`

### CI/CD

The CI/CD pipeline is managed by GitHub Actions. On every push to a feature branch or PR, the following checks are run:
-   Linting & Formatting
-   Unit & Component Tests (Vitest)
-   End-to-End Tests (Playwright)

A successful CI run is required to merge a PR into `main`. Merging to `main` automatically deploys the application to the staging environment on Cloudflare.

## Features

### Current Features

- **User Authentication:** Secure session-based authentication with email/password login
- **Todo Management:** RESTful API for creating, reading, updating, and deleting todos with support for:
  - Status tracking (TODO, IN_PROGRESS, DONE)
  - Priority levels (LOW, MEDIUM, HIGH)
  - Due dates and recurring tasks
  - Hierarchical todos (parent-child relationships)
  - Pagination and filtering

### Upcoming Features

- Todo UI components and frontend integration
- Real-time sync across devices
- Note-taking with rich text support
- Goal tracking and progress visualization

