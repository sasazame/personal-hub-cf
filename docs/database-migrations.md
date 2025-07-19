# Database Migration Guide

This guide covers how to create and apply database migrations for the Personal Hub application.

## Migration Files Location

All migration files are stored in the `/migrations` directory at the project root:
```
/personal-hub-cf/
└── migrations/
    ├── 0001_init.sql
    ├── 0002_goals.sql
    └── ... (future migrations)
```

## Creating New Migrations

### 1. Create Migration File

Create a new SQL file in the `/migrations` directory with a sequential number and descriptive name:

```bash
# Example: 0003_add_events_table.sql
touch migrations/0003_add_events_table.sql
```

### 2. Write Migration SQL

Add your SQL statements to the migration file. Example:

```sql
-- migrations/0003_add_events_table.sql
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_start_date ON events(start_date);
```

### 3. Update Schema Definition

After creating the migration, update the Drizzle schema in `packages/shared/src/db/schema.ts` to match the database structure.

## Applying Migrations

### Local Development

Apply migrations to your local development database:

```bash
cd apps/backend

# Apply to local database (no --remote flag)
wrangler d1 migrations apply personal-hub-db --local
```

### Staging Environment

Apply migrations to the staging database:

```bash
cd apps/backend

# Apply to remote staging database
wrangler d1 migrations apply personal-hub-db-staging --env staging --remote
```

### Production Environment

Apply migrations to the production database:

```bash
cd apps/backend

# Apply to remote production database
wrangler d1 migrations apply personal-hub-db-production --env production --remote
```

## Checking Migration Status

To see which migrations have been applied:

```bash
cd apps/backend

# List migrations for local database
wrangler d1 migrations list personal-hub-db --local

# List migrations for staging
wrangler d1 migrations list personal-hub-db-staging --env staging --remote

# List migrations for production
wrangler d1 migrations list personal-hub-db-production --env production --remote
```

## Migration Best Practices

### 1. Always Test Locally First
- Apply migrations to your local database before applying to staging/production
- Test the application thoroughly with the new schema

### 2. Migration Naming Convention
- Use sequential numbers: `0001_`, `0002_`, etc.
- Use descriptive names: `add_users_table`, `update_todos_status`, etc.
- Format: `XXXX_description.sql`

### 3. Migration Content Guidelines
- Migrations should be **idempotent** (safe to run multiple times)
- Use `IF NOT EXISTS` for `CREATE TABLE` statements
- Use `IF EXISTS` for `DROP TABLE` statements
- Include indexes for foreign keys and commonly queried columns
- Set appropriate `DEFAULT` values for new columns

### 4. Never Modify Existing Migrations
- Once a migration has been applied to production, never modify it
- Create a new migration to make changes instead

### 5. Backward Compatibility
- When possible, write migrations that maintain backward compatibility
- This allows for zero-downtime deployments

## Troubleshooting

### Migration Fails to Apply

1. **Check SQL Syntax**: Ensure your SQL is valid for SQLite
2. **Check Dependencies**: Ensure referenced tables/columns exist
3. **Check Permissions**: Ensure you have the correct Cloudflare API token

### Database Out of Sync

If your local database gets out of sync:

```bash
# Reset local database
rm -rf .wrangler/state/v3/d1

# Reapply all migrations
cd apps/backend
wrangler d1 migrations apply personal-hub-db --local
```

### Finding Database IDs

Database IDs are stored in `apps/backend/wrangler.toml`. To find them in Cloudflare:

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Workers & Pages → D1
3. Click on the database name
4. The database ID is shown in the details

## CI/CD Integration

Migrations are **not** automatically applied during CI/CD deployments. This is intentional to prevent accidental schema changes.

To deploy migrations:
1. Apply migrations manually as described above
2. Then trigger the deployment through GitHub Actions

## Environment Configuration

The `wrangler.toml` file contains the database configuration:

```toml
# Local development
[[d1_databases]]
binding = "DB"
database_name = "personal-hub-db"
database_id = "local"
migrations_dir = "../../migrations"

# Production
[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "personal-hub-db-production"
database_id = "your-production-id"
migrations_dir = "../../migrations"

# Staging
[env.staging]
[[env.staging.d1_databases]]
binding = "DB"
database_name = "personal-hub-db-staging"
database_id = "your-staging-id"
migrations_dir = "../../migrations"
```