import { vi } from 'vitest';
import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';

// Create a test context helper
export function createTestContext() {
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    selectDistinct: vi.fn(),
  };

  const env: Bindings = {
    DB: {} as any,
    JWT_SECRET: 'test-jwt-secret',
    OAUTH_GITHUB_CLIENT_ID: 'test-github-id',
    OAUTH_GITHUB_CLIENT_SECRET: 'test-github-secret',
    OAUTH_GOOGLE_CLIENT_ID: 'test-google-id',
    OAUTH_GOOGLE_CLIENT_SECRET: 'test-google-secret',
  };

  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
  
  // Add database middleware
  app.use('*', async (c, next) => {
    c.set('db', mockDb);
    await next();
  });

  // Create a valid test token (pre-signed with test-jwt-secret)
  // This is a valid JWT token signed with 'test-jwt-secret' that expires in 2030
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJ0eXBlIjoiYWNjZXNzIiwiZXhwIjoxODkzNDU2MDAwfQ.v6Q_9cAGQPR9nJmF4BFHQT6zLJMSNQaWEGS7FhR2vNg';

  return { app, env, db: mockDb, validToken };
}

// Helper to create mock database chain
export function createMockDbChain(result: any) {
  // Handle the select chain that doesn't have .all() at the end
  const baseChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue(result),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(Array.isArray(result) ? result : [result]),
    set: vi.fn().mockReturnThis(),
  };
  
  // Mock the Promise behavior for select queries
  // This allows await db.select().from().where() to resolve to the result
  const promiseMock = Promise.resolve(result);
  Object.assign(promiseMock, baseChain);
  
  return promiseMock as any;
}

// Helper to create request with auth header
export function createAuthRequest(token: string) {
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}