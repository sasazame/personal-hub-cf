# E2E Testing Guide

## Overview

This project uses Playwright for end-to-end testing. Tests are organized to ensure critical functionality works correctly across different environments.

## Test Organization

### Test Files Structure

```
e2e/
├── ci-critical.spec.ts      # Comprehensive CI test suite (NEW)
├── ci.spec.ts               # Basic CI smoke tests
├── auth-basic.spec.ts       # Authentication flow tests
├── todo-basic.spec.ts       # Todo CRUD operations
├── notes.spec.ts            # Notes functionality
├── calendar.spec.ts         # Calendar features
├── api-health.spec.ts       # API health checks
└── smoke.spec.ts            # Quick smoke tests
```

### Test Configurations

We have multiple Playwright configurations for different scenarios:

1. **playwright.config.ts** - Default configuration for local development
2. **playwright.ci.config.ts** - Minimal CI configuration (4 tests only)
3. **playwright.ci.extended.config.ts** - Extended CI with broader coverage (NEW)
4. **playwright.quick.config.ts** - Quick tests for rapid feedback

## Running Tests

### Local Development

```bash
# Install Playwright browsers (first time only)
pnpm test:e2e:install

# Run all E2E tests
pnpm test:e2e

# Run tests with UI mode (interactive)
pnpm test:e2e:ui

# Run quick smoke tests
pnpm test:e2e:quick

# Run tests with automatic server startup
pnpm test:e2e:with-servers
```

### CI Test Suites

```bash
# Run minimal CI tests (original 4 tests)
pnpm test:ci

# Run extended CI tests (multiple spec files)
pnpm test:ci:extended

# Run comprehensive critical path tests
pnpm test:ci:critical
```

### Running Specific Tests

```bash
# Run a specific test file
pnpm playwright test e2e/auth-basic.spec.ts

# Run tests matching a pattern
pnpm playwright test -g "should login"

# Run tests in headed mode (see browser)
pnpm playwright test --headed
```

## Test Servers

Tests require both backend and frontend servers running:

### Manual Server Start

```bash
# Terminal 1: Start backend
cd apps/backend && pnpm dev

# Terminal 2: Start frontend  
cd apps/frontend && pnpm dev

# Terminal 3: Run tests
SKIP_WEBSERVER=1 pnpm test:e2e
```

### Automatic Server Start

The default configuration automatically starts servers unless `SKIP_WEBSERVER=1` is set.

## CI/CD Integration

### GitHub Actions

The CI workflow runs E2E tests on every push and pull request:

1. Builds all packages
2. Starts backend server (Wrangler)
3. Starts frontend server (Vite)
4. Runs E2E tests with extended configuration
5. Uploads test results as artifacts

### Environment Variables

- `E2E_BASE_URL` - Frontend URL (default: http://localhost:3000)
- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:8787)
- `SKIP_WEBSERVER` - Skip automatic server startup
- `CI` - Set in CI environment for optimized configuration

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/path');
    
    // Act
    await page.click('button');
    
    // Assert
    await expect(page.locator('h1')).toContainText('Expected');
  });
});
```

### Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for network idle** when navigating between pages
3. **Use explicit waits** instead of arbitrary timeouts
4. **Generate unique test data** using timestamps
5. **Clean up test data** after tests complete
6. **Group related tests** using describe blocks
7. **Keep tests independent** - each test should run in isolation

### Common Patterns

#### Authentication Helper
```typescript
async function registerAndLogin(page, testData) {
  await page.goto('/register');
  // ... registration flow
  return testData;
}
```

#### Waiting for API Responses
```typescript
const responsePromise = page.waitForResponse(
  resp => resp.url().includes('/api/v1/resource') && resp.status() === 200
);
await page.click('button');
await responsePromise;
```

#### Handling Modals
```typescript
await page.click('button:has-text("Open Modal")');
await page.waitForSelector('.modal', { state: 'visible' });
// ... interact with modal
await page.waitForSelector('.modal', { state: 'hidden' });
```

## Troubleshooting

### Common Issues

1. **EPIPE Errors**: Disable global setup in configuration
2. **Timeout Errors**: Increase timeout values or wait for specific conditions
3. **Flaky Tests**: Add explicit waits and ensure proper test isolation
4. **Server Issues**: Ensure ports 3000 and 8787 are free

### Debug Mode

```bash
# Run with debug output
DEBUG=pw:api pnpm test:e2e

# Run with trace viewer
pnpm playwright test --trace on
pnpm playwright show-trace
```

### View Test Reports

```bash
# After test run
pnpm test:e2e:report
```

## Performance Optimization

1. **Parallel Execution**: Tests run in parallel by default
2. **Worker Limits**: CI uses 2 workers, local uses 4
3. **Selective Testing**: Use test.only() during development
4. **Reuse Authentication**: Store auth state between tests
5. **Minimize Waits**: Use condition-based waits over fixed timeouts

## Test Coverage Goals

### Critical Path (Must Pass)
- User registration and login
- Todo CRUD operations
- Note creation and viewing
- Navigation between sections
- Session persistence
- Logout functionality

### Extended Coverage
- Calendar events
- Goal tracking
- Pomodoro timer
- Analytics dashboard
- User settings
- Profile management

## Future Improvements

1. **Visual Regression Testing**: Add screenshot comparison tests
2. **Performance Testing**: Measure and track page load times
3. **Accessibility Testing**: Add automated a11y checks
4. **Cross-browser Testing**: Enable Firefox and Safari tests
5. **Mobile Testing**: Add responsive design tests
6. **API Contract Testing**: Validate API responses against schemas