import type { Config } from 'drizzle-kit';

export default {
  schema: './packages/shared/src/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    wranglerConfigPath: './apps/backend/wrangler.toml',
    dbName: 'personal-hub-db',
  },
} satisfies Config;