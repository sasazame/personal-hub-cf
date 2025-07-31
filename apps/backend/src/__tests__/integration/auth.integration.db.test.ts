import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { Hono } from 'hono';
import authRoutes from '../../routes/auth';
import { setupTestDatabase, cleanupTestDatabase, createTestUser, closeTestDatabase } from './setup-test-db';
import { hashPassword } from '../../utils/auth';
import type { Bindings, Variables } from '../../types';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

describe('Auth Routes Integration with Real Database', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let db: DrizzleD1Database;
  let env: Bindings;

  beforeEach(async () => {
    // Setup test database
    const setup = await setupTestDatabase();
    db = setup.db as any;
    env = setup.env as Bindings;

    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Add database middleware
    app.use('*', async (c, next) => {
      c.set('db', db as any);
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
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; username: string };
      };
      
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body).toHaveProperty('user');
      expect(body.user.email).toBe('newuser@example.com');
      expect(body.user.username).toBe('newuser');
      expect(body.user).not.toHaveProperty('password');
    });

    it('should reject duplicate email', async () => {
      // Create existing user
      await createTestUser(db as any, {
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
      const user = await createTestUser(db as any, {
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
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; username: string };
      };
      
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body.user.id).toBe(user.id);
    });

    it('should reject disabled user', async () => {
      const password = 'TestPass123!';
      const hashedPassword = await hashPassword(password);
      
      // Create disabled user
      await createTestUser(db as any, {
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