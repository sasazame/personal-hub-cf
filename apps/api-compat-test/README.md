# API Compatibility Test Suite

This test suite ensures 100% API compatibility between the original Spring Boot backend and the new Cloudflare Workers backend during migration.

## 🎯 Purpose

- Validate that all API endpoints return identical responses
- Ensure authentication flows work exactly the same
- Catch any breaking changes before deployment
- Provide confidence during incremental migration

## 🚀 Usage

### Running Tests

```bash
# Run all compatibility tests
pnpm test:compare

# Run with verbose output
VERBOSE=true pnpm test:compare

# Test against specific backends
OLD_BACKEND_URL=http://localhost:8080/api/v1 \
NEW_BACKEND_URL=http://localhost:8787/api/v1 \
pnpm test:compare
```

### Running Unit Tests

```bash
# Run unit tests for the test framework itself
pnpm test

# Watch mode
pnpm test:watch
```

## 📋 Test Coverage

### Currently Implemented
- ✅ Authentication endpoints (`/auth/*`)
  - Registration
  - Login
  - Token refresh
  - User profile
  - Password reset
  - OAuth2 flows

### To Be Implemented
- 📝 TODO management (`/todos/*`)
- 🎯 Goals (`/goals/*`)
- 🍅 Pomodoro (`/pomodoro/*`)
- 📅 Calendar/Events (`/events/*`)
- 📝 Notes (`/notes/*`)
- ⏰ Moments (`/moments/*`)
- 👤 User management (`/users/*`)
- 📊 Analytics (`/analytics/*`)

## 🔧 Configuration

Environment variables:
- `OLD_BACKEND_URL` - Original Spring Boot backend (default: `http://localhost:8080/api/v1`)
- `NEW_BACKEND_URL` - New Cloudflare Workers backend (default: `http://localhost:8787/api/v1`)
- `VERBOSE` - Enable detailed output (default: `false`)

## 📝 Writing New Tests

1. Create a new test file in `src/tests/`
2. Export an array of `APITest` objects
3. Import in `src/index.ts`

Example:
```typescript
export const todoTests: APITest[] = [
  {
    name: 'GET /todos - List all todos',
    method: 'GET',
    endpoint: '/todos',
    requiresAuth: true,
    authToken: getAuthToken(),
    expectedStatus: 200,
    validateResponse: (oldRes, newRes) => {
      // Custom validation logic
    }
  }
];
```

## 🎨 Test Structure

```
api-compat-test/
├── src/
│   ├── config.ts           # Configuration
│   ├── index.ts            # Main entry point
│   ├── compare.ts          # CLI runner
│   ├── utils/
│   │   ├── api-client.ts   # HTTP client
│   │   ├── comparator.ts   # Response comparison
│   │   └── test-runner.ts  # Test execution
│   └── tests/
│       └── auth.test.ts    # Authentication tests
└── README.md
```

## 🔍 Comparison Logic

The test suite compares:
- HTTP status codes
- Response body structure and values
- Important headers (content-type, rate limits)

Automatically ignores:
- Timestamps (createdAt, updatedAt)
- Generated IDs
- JWT tokens
- Minor header differences

## 📊 Test Report

After running, you'll see:
- Total tests run
- Pass/fail count
- Success rate
- Detailed failure information
- Execution time

Example output:
```
================================================================================
API COMPATIBILITY TEST REPORT
================================================================================

Total Tests: 22
✅ Passed: 20
❌ Failed: 2
⏩ Skipped: 0
Success Rate: 90.91%

FAILED TESTS:
--------------------------------------------------------------------------------

❌ POST /auth/register - Create new user
   - Status code mismatch: 201 !== 200
     Old: 201
     New: 200
```