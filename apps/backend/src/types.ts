/* eslint-disable no-undef */
export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  OAUTH_GITHUB_CLIENT_ID: string;
  OAUTH_GITHUB_CLIENT_SECRET: string;
  OAUTH_GOOGLE_CLIENT_ID: string;
  OAUTH_GOOGLE_CLIENT_SECRET: string;
  ENVIRONMENT: string;
  RATE_LIMITER: KVNamespace;
  ALLOWED_ORIGINS?: string;
};

export type Variables = {
  userId?: string;
  db: import('./db').Database;
};