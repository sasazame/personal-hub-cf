# Backend Test Setup

## Current Status

✅ **Test Framework Installed**: Vitest v3.2.4  
⚠️ **Test Coverage**: Basic tests created, need fixes
❌ **Tests Passing**: 11 failed, 13 passed

## Test Structure

```
src/__tests__/
├── utils/
│   ├── spring-boot-compat.test.ts  # Error response formatting tests
│   └── auth.test.ts                # Password hashing & JWT tests
└── routes/
    └── auth.test.ts                # Auth endpoints tests
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test -- --coverage
```

## Issues to Fix

1. **Import issues** - Some functions have different names/signatures
2. **Mock setup** - Need proper mocks for D1 database
3. **Test environment** - Need to handle Cloudflare Workers specific APIs

## Next Steps

1. Fix failing tests by correcting imports and mocks
2. Add tests for all routes (todos, goals, events, etc.)
3. Add integration tests
4. Set up test database fixtures
5. Add CI/CD pipeline with automated testing

## Test Guidelines

- Unit tests for utilities and helpers
- Integration tests for API endpoints
- Mock external dependencies (D1, JWT)
- Test error cases and edge conditions
- Maintain >80% code coverage