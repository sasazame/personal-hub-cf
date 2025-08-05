import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { Hono } from 'hono';
import authRoutes from '../../routes/auth';
import { setupTestDatabase, cleanupTestDatabase, createTestUser, closeTestDatabase } from './setup-test-db';
import { hashPassword } from '../../utils/auth';
import type { Bindings, Variables } from '../../types';
import type { Database } from '../../db';

describe('Auth Routes Integration with Real Database', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let db: Database;
  let env: Bindings;

  beforeEach(async () => {
    // Setup test database
    const setup = await setupTestDatabase();
    db = setup.db as Database;
    env = setup.env as Bindings;

    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Add database middleware
    app.use('*', async (c, next) => {
      c.set('db', db);
      await next();
    });
    
    // Mount auth routes
    app.route('/auth', authRoutes);
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });
  
  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('POST /auth/register', () => {
    it('should create a new user and return tokens', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'TestPass123!',
          username: 'newuser',
        }),
      }, env);

      expect(res.status).toBe(201);
      const body = await res.json() as {
        user: { id: string; email: string; username: string };
        csrfToken: string;
      };
      
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('csrfToken');
      expect(body).not.toHaveProperty('accessToken');
      expect(body).not.toHaveProperty('refreshToken');
      expect(body.user.email).toBe('newuser@example.com');
      expect(body.user.username).toBe('newuser');
      expect(body.user).not.toHaveProperty('password');
      
      // Check that auth cookies are set
      const setCookieHeaders = res.headers.getSetCookie();
      expect(setCookieHeaders).toBeDefined();
      expect(setCookieHeaders.some(h => h.includes('access-token='))).toBe(true);
      expect(setCookieHeaders.some(h => h.includes('refresh-token='))).toBe(true);
      expect(setCookieHeaders.some(h => h.includes('session-id='))).toBe(true);
    });

    it('should reject duplicate email', async () => {
      // Create existing user
      await createTestUser(db, {
        email: 'existing@example.com',
        username: 'existing',
      });

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'TestPass123!',
          username: 'newusername',
        }),
      }, env);

      expect(res.status).toBe(409);
      const body = await res.json() as { code: string; message?: string };
      expect(body.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('POST /auth/login', () => {
    it('should login existing user', async () => {
      const password = 'TestPass123!';
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await createTestUser(db, {
        email: 'user@example.com',
        username: 'testuser',
        password: hashedPassword,
      });

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: password,
        }),
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as {
        user: { id: string; email: string; username: string };
        csrfToken: string;
      };
      
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('csrfToken');
      expect(body).not.toHaveProperty('accessToken');
      expect(body).not.toHaveProperty('refreshToken');
      expect(body.user.id).toBe(user.id);
      
      // Check that auth cookies are set
      const setCookieHeaders = res.headers.getSetCookie();
      expect(setCookieHeaders).toBeDefined();
      expect(setCookieHeaders.some(h => h.includes('access-token='))).toBe(true);
      expect(setCookieHeaders.some(h => h.includes('refresh-token='))).toBe(true);
      expect(setCookieHeaders.some(h => h.includes('session-id='))).toBe(true);
    });

    it('should reject disabled user', async () => {
      const password = 'TestPass123!';
      const hashedPassword = await hashPassword(password);
      
      // Create disabled user
      await createTestUser(db, {
        email: 'disabled@example.com',
        username: 'disabled',
        password: hashedPassword,
        enabled: 0,
      });

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'disabled@example.com',
          password: password,
        }),
      }, env);

      expect(res.status).toBe(403);
      const body = await res.json() as { code: string; message?: string };
      expect(body.code).toBe('FORBIDDEN');
    });
  });
});