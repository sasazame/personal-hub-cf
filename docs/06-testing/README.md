# Testing Guide

Comprehensive testing documentation for Personal Hub.

## Contents

- [Local CI Testing](./local-ci-testing.md) - Run CI tests locally with act

## Test Types

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
pnpm test:e2e
```

### Quality Gate
```bash
./scripts/quality-gate.sh
```

## Test Structure

- Unit tests: Located alongside source files as `*.test.ts`
- E2E tests: Located in `/e2e` directory
- Integration tests: In `__tests__/integration/`

## CI/CD Integration

All tests run automatically on:
- Pull requests
- Main branch commits
- Pre-deployment checks

## Best Practices

1. Write tests for all new features
2. Maintain test coverage above 90%
3. Use meaningful test descriptions
4. Mock external dependencies
5. Keep tests fast and isolated