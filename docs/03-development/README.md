# Development Guide

This section covers everything you need to know for developing Personal Hub.

## Contents

- Development environment setup
- Code organization
- Best practices
- Debugging tips

## Quick Commands

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format
```

## Project Structure

```
personal-hub-cf/
├── apps/
│   ├── backend/     # Cloudflare Workers API
│   └── frontend/    # React frontend
├── packages/        # Shared packages
├── docs/           # Documentation
└── scripts/        # Utility scripts
```

## Development Workflow

1. Create a feature branch
2. Make your changes
3. Run quality checks
4. Submit a pull request

## Related Documentation

- [Testing Guide](../06-testing/)
- [API Development](../05-api/)
- [Deployment](../04-deployment/)