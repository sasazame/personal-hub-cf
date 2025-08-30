# Local CI Testing with Act

This guide explains how to run GitHub Actions CI tests locally using [act](https://github.com/nektos/act).

## Prerequisites

- Docker installed and running
- act installed (see installation section)

## Installation

### Install act

Run the setup script:

```bash
./scripts/setup-act.sh
```

Or install manually:

- **macOS**: `brew install act`
- **Linux**: Download from [GitHub releases](https://github.com/nektos/act/releases)
- **Windows**: Use WSL2 and follow Linux instructions

## Configuration Files

- `.actrc` - Act configuration (default settings)
- `.env.act` - Environment variables for CI tests
- `playwright.act.config.ts` - Playwright config for Docker environment
- `scripts/run-act-e2e.sh` - Helper script to run E2E tests

## Running Tests

### Run all CI tests

```bash
# Run default job (test)
act

# List all available jobs
act -l

# Run specific job
act -j build
act -j e2e
```

### Run E2E tests specifically

```bash
# Using the helper script (recommended)
./scripts/run-act-e2e.sh

# Or manually
act -j e2e --secret-file .env.act -W .github/workflows/ci.yml
```

### Run with specific event

```bash
# Simulate pull request
act pull_request

# Simulate push to main
act push -b main

# Note: In CI, E2E tests are executed on pull requests.
# Pushes to main skip E2E (validated at PR time).
```

## Troubleshooting

### Docker issues

If you get Docker-related errors:

1. Ensure Docker is running: `docker info`
2. Check Docker resources (memory/CPU)
3. Try with `--container-architecture linux/amd64` for M1 Macs

### Test failures

1. Check that all services are built: `pnpm build`
2. Verify environment variables in `.env.act`
3. Run with verbose mode: `act -v`

### Port conflicts

If ports are already in use:

1. Stop local dev servers
2. Check for running containers: `docker ps`
3. Use different ports in `.env.act`

## Differences from GitHub Actions

- act uses Docker containers (may be slower)
- Some GitHub-specific features unavailable
- Limited to public Docker images
- No access to GitHub secrets (use `.env.act`)

## Best Practices

1. Always test with act before pushing
2. Keep `.env.act` updated with CI variables
3. Use the same Node.js version as CI
4. Run specific jobs to save time
5. Use `--reuse` flag for faster runs

## Example Workflow

```bash
# 1. Make changes to code
# 2. Run unit tests locally
pnpm test

# 3. Run E2E tests in CI environment
./scripts/run-act-e2e.sh

# 4. If all passes, commit and push
git add .
git commit -m "feat: add new feature"
git push
```
