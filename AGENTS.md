# Repository Guidelines

## Project Structure & Module Organization
- `apps/backend`: Cloudflare Workers API (Hono) and D1 schema/migrations.
- `apps/frontend`: React (Vite) app, components and pages.
- `packages/shared`, `packages/ui`, `packages/api-client`: shared types, UI, and client helpers.
- `e2e`: Playwright tests (`*.spec.ts`).
- `docs`: User and developer documentation.
- `scripts`: Utility scripts (E2E helpers, CI/local tooling).

## Build, Test, and Development Commands
- `pnpm dev`: Run backend and frontend dev servers in parallel.
- `pnpm build`: Build all workspaces.
- `pnpm typecheck`: TypeScript checks across the repo.
- `pnpm lint`: ESLint across the repo.
- `pnpm test`: Unit/integration tests (Vitest).
- `pnpm test:e2e`: Run Playwright E2E tests (headless). Use `:ui` to open UI.
- `./scripts/run-e2e-tests.sh`: Start servers and execute E2E safely.
- Example: `pnpm --filter @personal-hub/frontend build` to target a package.

## Coding Style & Naming Conventions
- Language: TypeScript everywhere. Components use PascalCase; hooks use `useX` camelCase.
- Prettier: 2-space tabs, single quotes, printWidth 100. Run `pnpm format`.
- ESLint: TypeScript + recommended rules enforced via CI. Run `pnpm lint`.
- CSS/Theme: Prefer semantic tokens (e.g., `bg-background`, `text-foreground`) over hardcoded colors; ensure light/dark/system parity.
- i18n: No hardcoded UI strings; add keys for `en`/`ja`.

## Testing Guidelines
- Frameworks: Vitest for unit/integration; Playwright for E2E.
- Locations: co-located `*.test.ts`; E2E in `/e2e`.
- Coverage: Keep high coverage; add tests with every feature.
- E2E scope: Cover basic CRUD flows for Todos, Notes, Moments, Events, Goals, Pomodoro.
- Commands: `pnpm test`, `pnpm test:e2e`, `pnpm test:ci`.

## Commit & Pull Request Guidelines
- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`.
- Docs-only commits: append `[skip ci]`.
- PRs: clear description, linked issues, screenshots for UI, note migrations/feature flags.
- Checks: typecheck, lint, unit, and E2E must pass locally before pushing.
- Review `docs/DEVELOPMENT_CHECKLIST.md` before opening a PR (cross-feature impacts, theme/i18n parity, CRUD E2E coverage, build passes, and `[skip ci]` for docs-only changes).

## Security & Configuration Tips
- API base path: `/api/v1`. Include `Authorization: Bearer <token>` and `X-CSRF-Token` for state-changing requests.
- Secrets: never commit; use `apps/backend/.dev.vars` locally and GitHub/Cloudflare secrets in CI.
- D1 migrations: verify locally before PR; CI/Deploy runs automatic migrations in production.
