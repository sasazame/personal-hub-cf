import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth';
import { generateTokens } from '../../utils/auth';
import { createMockDbChain } from '../helpers/test-context';
import type { Bindings, Variables } from '../../types';
import type { D1Database } from '@cloudflare/workers-types';

describe('Auth Middleware', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let env: Bindings;
  let mockDb: {
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    
    env = {
      DB: {} as D1Database,
      JWT_SECRET: 'test-jwt-secret',
      OAUTH_GITHUB_CLIENT_ID: 'test',
      OAUTH_GITHUB_CLIENT_SECRET: 'test',
      OAUTH_GOOGLE_CLIENT_ID: 'test',
      OAUTH_GOOGLE_CLIENT_SECRET: 'test',
      ENVIRONMENT: 'test',
    };

    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Add database middleware
    app.use('*', async (c, next) => {
      c.set('db', mockDb);
      await next();
    });
    
    // Add test route with auth middleware
    app.use('/protected/*', authMiddleware);
    app.get('/protected/test', (c) => {
      const userId = c.get('userId');
      return c.json({ userId, message: 'Protected route accessed' });
    });
  });

  it('should reject request without authorization header', async () => {
    const res = await app.request('/protected/test', {
      method: 'GET',
    }, env);

    expect(res.status).toBe(401);
    const body = await res.json() as { code: string; message?: string };
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('should reject request with invalid authorization format', async () => {
    const res = await app.request('/protected/test', {
      method: 'GET',
      headers: {
        'Authorization': 'InvalidFormat token',
      },
    }, env);

    expect(res.status).toBe(401);
    const body = await res.json() as { code: string; message?: string };
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('should reject request with invalid token', async () => {
    const res = await app.request('/protected/test', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid.jwt.token',
      },
    }, env);

    expect(res.status).toBe(401);
    const body = await res.json() as { code: string; message?: string };
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('should accept valid token and set userId', async () => {
    const userId = 'test-user-123';
    const tokens = await generateTokens(userId, env.JWT_SECRET);
    
    // Mock user exists and is enabled
    mockDb.select.mockReturnValue(createMockDbChain({
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      enabled: true,
    }));

    const res = await app.request('/protected/test', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json() as { userId: string; message: string };
    expect(body.userId).toBe(userId);
    expect(body.message).toBe('Protected route accessed');
  });

  it('should reject expired token', async () => {
    // Create an expired token
    const expiredToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJ0eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjAwMDAwMDAwfQ.expired';
    
    const res = await app.request('/protected/test', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${expiredToken}`,
      },
    }, env);

    expect(res.status).toBe(401);
    const body = await res.json() as { code: string; message?: string };
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('should reject refresh token for protected routes', async () => {
    const userId = 'test-user-123';
    const tokens = await generateTokens(userId, env.JWT_SECRET);

    const res = await app.request('/protected/test', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokens.refreshToken}`,
      },
    }, env);

    expect(res.status).toBe(401);
    const body = await res.json() as { code: string; message?: string };
    expect(body.code).toBe('UNAUTHORIZED');
  });
});