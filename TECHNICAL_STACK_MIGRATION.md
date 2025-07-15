# Technical Stack for personal-hub-cf Migration

This document outlines the target technical stack and architecture for the migration of the Personal Hub project to a modern, edge-native full-stack application running on Cloudflare.

## 1. Core Philosophy & Architecture

- **Project Name:** `personal-hub-cf`
- **Architecture:** Full-stack monorepo.
- **Core Principles:**
    - **TypeScript First:** End-to-end type safety from the database to the UI.
    - **Edge Native:** All code (backend and frontend) is designed to run on Cloudflare's global edge network for minimal latency.
    - **Developer Experience:** Fast, modern tooling to maximize productivity and code quality.

## 2. Project Structure

- **Package Manager:** `pnpm` with `workspaces`. It's efficient for managing monorepos and controlling dependencies.
- **Directory Structure:** A standard monorepo layout.
  ```
  /personal-hub-cf/
  ├── apps/
  │   ├── frontend/  # React SPA (Cloudflare Pages)
  │   └── backend/   # Hono API (Cloudflare Workers)
  ├── packages/
  │   ├── ui/        # Shared React components (e.g., buttons, inputs)
  │   └── shared/    # Shared code, primarily for API type definitions (Zod schemas)
  ├── pnpm-workspace.yaml
  └── package.json
  ```

## 3. Backend Stack

- **Runtime:** Cloudflare Workers
- **Framework:** `Hono`
  - **Reasoning:** Extremely lightweight, fast, and built specifically for edge environments. It has great middleware support and a simple API.
- **Database:** `Cloudflare D1`
  - **Reasoning:** A serverless SQL database that lives on the edge, providing low-latency access from Workers.
- **ORM / Query Builder:** `Drizzle ORM`
  - **Reasoning:** A TypeScript-native ORM that provides excellent type safety by generating types directly from your database schema. It's lightweight and works seamlessly with D1.
- **Validation:** `Zod`
  - **Reasoning:** For defining data schemas that serve as a single source of truth for both validation (e.g., incoming request bodies) and TypeScript types. Use with `@hono/zod-validator`.
- **Authentication:** `Lucia Auth`
  - **Reasoning:** A modern, session-based authentication library with excellent support for serverless and edge environments. It simplifies implementing secure OAuth and password-based login flows.
  - **OAuth Providers:** Will support Google and GitHub to match existing functionality.
- **Deployment Tool:** `Wrangler` CLI

## 4. Frontend Stack

- **Deployment Target:** Cloudflare Pages
- **Framework:** `React`
- **Build Tool / Dev Server:** `Vite`
  - **Reasoning:** Provides a significantly faster development experience with near-instant server start and Hot Module Replacement (HMR).
- **UI Components & Styling:**
  - **CSS Framework:** `Tailwind CSS`
    - **Reasoning:** A utility-first approach for rapid, custom UI development.
  - **Component Library:** `Shadcn/ui`
    - **Reasoning:** A collection of beautifully designed, accessible, and unstyled components that you can copy and paste into your project, giving you full control over their code and style.
- **API & Server State Management:** `TanStack Query (React Query)`
  - **Reasoning:** Essential for managing asynchronous operations like fetching, caching, and updating data from the backend. It drastically simplifies data-fetching logic and improves UX.
- **Forms:** `React Hook Form`
  - **Reasoning:** A performant, flexible, and easy-to-use library for managing form state and validation, with excellent integration for Zod schemas.

## 5. Shared Tooling & CI/CD

- **Testing Framework:** `Vitest`
  - **Reasoning:** A Vite-native testing framework with a Jest-compatible API. It's fast, simple to configure, and works seamlessly within the Vite ecosystem.
- **Linter:** `ESLint`
- **Formatter:** `Prettier`
- **CI/CD:** GitHub Actions workflow to run linting, testing, and deploy to Cloudflare Pages/Workers on push to the main branch.

## 6. Migration Workflow

This section defines the execution order for migrating to the new Cloudflare-native architecture. This approach prioritizes establishing a solid foundation, ensuring test continuity, and iteratively migrating features. Production data migration is not required as the service has not yet been officially launched.

### Phase 1: Foundation & Authentication

1.  **Environment Setup (Monorepo & Tooling):**
    *   Initialize the `pnpm` workspace with the `apps/frontend`, `apps/backend`, `packages/ui`, and `packages/shared` directory structure.
    *   Create basic scaffolds for the backend (Hono on Cloudflare Workers) and frontend (React/Vite on Cloudflare Pages).
    *   Set up common development tools: ESLint, Prettier, Vitest, and a CI workflow with GitHub Actions.

2.  **Database Schema Definition (Schema-as-Code):**
    *   Adopt a **"Schema-as-Code"** strategy. The database schema will be the single source of truth, defined entirely in a TypeScript file (`packages/shared/src/db/schema.ts`) using `Drizzle ORM`.
    *   Use `drizzle-kit` to automatically generate SQL migration files by comparing the TypeScript schema with the database state.
    *   Prepare a seeding script (`packages/shared/src/db/seed.ts`) for populating development data. This replaces manual SQL management and ensures type safety.

3.  **Core Authentication Implementation:**
    *   Integrate `Lucia Auth` into the backend to implement APIs for user registration, login/logout, and session management.
    *   Develop the corresponding authentication forms and UI on the frontend to consume these APIs, ensuring basic login/logout functionality.

### Phase 2: Testing & Feature Migration

4.  **E2E Test Integration & Baseline:**
    *   Migrate the existing Playwright E2E test suite to the new project.
    *   Update test authentication steps to align with the new `Lucia Auth` flow.
    *   Run the tests and confirm that most will fail due to unimplemented features. This "failing" state will serve as the baseline for measuring migration progress.

5.  **Shared Component Migration (TDD):**
    *   Re-implement common UI components (e.g., Button, Input, Modal) in the `packages/ui` directory using `Shadcn/ui` and `Tailwind CSS`.
    *   Adopt a Test-Driven Development (TDD) approach with `Vitest` to ensure component quality and reliability.

6.  **Iterative Feature Migration:**
    *   Select existing features (e.g., Todo management, Goals) one by one for migration.
    *   **Backend:** Implement type-safe API endpoints using Hono and Zod.
    *   **Frontend:** Implement the corresponding UI and logic using `TanStack Query` and `React Hook Form`.
    *   **Verification:** Fix the corresponding E2E tests until they pass (turn Green).
    *   Repeat this cycle until all features are migrated and all E2E tests pass.

### Phase 3: Final Testing & Deployment

7.  **Final Testing & Rollout:**
    *   Ensure all E2E tests are stable and passing consistently.
    *   Conduct thorough regression and performance testing in a staging environment.
    *   Once validated, deploy the application to production for its official launch.

## 7. Source Control, Commits, and CI/CD

This project uses GitHub for source control and leverages GitHub Actions for CI/CD, following the **GitHub Flow** methodology to ensure rapid, high-quality releases.

### Branching Strategy

*   **`main`**: The primary and sole long-lived branch. It represents the latest stable version of the application and must always be in a deployable state.
    *   **Branch Protection**: The `main` branch will be protected by GitHub branch protection rules. Direct pushes will be disabled, and merging will require at least one peer review and a passing CI build. This enforces the workflow at the repository level and prevents accidental errors.
*   **Feature Branches**: All development, including features, fixes, and documentation, must occur in short-lived feature branches (e.g., `feat/authentication`, `fix/todo-validation`).
*   **Pull Requests (PRs)**: Changes are merged into `main` exclusively through Pull Requests.
    *   **PR Template**: A Pull Request template will be used to ensure that each PR includes a clear description of the changes, the motivation behind them, and a summary of the testing performed. This improves review quality and documentation.

### Commit Granularity and Style

*   **Atomicity**: Commits should be small, atomic, and represent a single logical change. This enhances clarity in code reviews and project history.
*   **Commit Message Convention**: We will follow the **Conventional Commits** specification. This improves readability and allows for automated changelog generation.
    *   **Format**: `<type>(<scope>): <subject>` (e.g., `feat(api): add user login endpoint`, `fix(ui): correct button alignment`).
    *   **Common Types**: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`.

*   **Commit Timing Examples**: A commit should be made at the completion of each logical step. For example:
    *   After initializing the monorepo: `chore: initialize pnpm workspace`
    *   After defining the DB schema: `feat(db): define initial schema for todos and users`
    *   When adding a test for a new component: `test(ui): add tests for PrimaryButton`
    *   When implementing the component: `feat(ui): implement PrimaryButton component`
    *   After a successful refactor: `refactor(api): simplify authentication middleware`

### Continuous Integration & Deployment (CI/CD)

The CI/CD pipeline is designed around the principle of promoting a single, immutable build artifact across environments.

*   **Continuous Integration (CI)**: The GitHub Actions workflow is triggered on every push to a feature branch and on all PRs targeting `main`.
    *   **Jobs**: The CI pipeline will execute the following checks:
        1.  **Lint & Format**: Run `ESLint` and `Prettier` to enforce code style.
        2.  **Unit/Component Tests**: Run `Vitest` to validate individual components and functions.
        3.  **E2E Tests**: Run the `Playwright` suite to ensure end-to-end functionality.
    *   **PR Gate**: A successful CI run is mandatory for merging a PR into `main`.

*   **Continuous Deployment (CD)**:
    *   **Trigger**: A new deployment process is initiated automatically every time a PR is merged into the `main` branch.
    *   **Staging Deployment**: The CI/CD pipeline builds the application, creating a release artifact. This artifact is then automatically deployed to the **staging** environment on Cloudflare.
    *   **Production Deployment**: After the changes are verified on staging, the **same artifact** is promoted to the **production** environment. This promotion is a manual step, triggered via a GitHub Actions workflow (e.g., requiring a manual approval or a tag push), ensuring that only validated code reaches users.

## 8. Environment, Configuration, and Observability

- **Environments:** The project will maintain distinct configurations for `local`, `staging`, and `production` environments.
- **Configuration & Secrets:**
    - **Local:** Use `.dev.vars` file for local development secrets and environment variables, managed by Wrangler.
    - **Staging & Production:** Use the Cloudflare dashboard to manage secrets and environment-specific settings. This ensures that sensitive data is not committed to the repository.
- **Observability:**
    - **Logging:** Standard Worker logs can be monitored in real-time using `wrangler tail`. For easier analysis, consider adopting a lightweight structured logging convention (e.g., JSON logs) to simplify parsing in Cloudflare Logs or third-party tools.
    - **Error Monitoring:** For proactive and robust error tracking, integrate a third-party service like **Sentry**. This should include both backend (`@sentry/node` or similar) and frontend (`@sentry/react`) monitoring to provide detailed error reports and performance insights across the entire stack.

## 8. Key Benefit: End-to-End Type Safety

The most significant advantage of this stack is the ability to share type definitions between the backend and frontend.

1.  **Define Once:** API request/response schemas are defined in the `packages/shared` directory using `Zod`.
2.  **Backend Validation:** The Hono backend uses these Zod schemas to validate all incoming requests.
3.  **Frontend Type Inference:** The React frontend imports the *types* inferred from these same Zod schemas to ensure all API calls are type-safe.

This eliminates a whole class of bugs and ensures that the frontend and backend are always in sync.
