# Migration Documentation

Guides for migrating and upgrading Personal Hub.

## Contents

- [Migration Guide V2](./MIGRATION_GUIDE_V2.md) - Comprehensive migration strategy
- [Migration Progress](./MIGRATION_PROGRESS.md) - Current migration status
- [Tailwind V4 Migration](./tailwind-v4-migration.md) - CSS framework upgrade

## Migration Philosophy

Our migration approach prioritizes:
1. **Zero downtime** - Users should never experience interruptions
2. **API compatibility** - Maintain backward compatibility
3. **Incremental changes** - Small, testable steps
4. **Rollback capability** - Easy reversion if issues arise

## Current Status

The project is currently migrating from:
- Spring Boot → Cloudflare Workers (Backend)
- Next.js → Vite + React (Frontend)
- PostgreSQL → Cloudflare D1 (Database)

## Version History

- v2.0.0 - Cloudflare migration (current)
- v1.0.0 - Initial Spring Boot + Next.js version