import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import authRoutes from '../../routes/auth';
import { createMockDbChain } from '../helpers/test-context';
import { hashPassword } from '../../utils/auth';
import type { Bindings, Variables } from '../../types';

describe('Auth Routes Integration', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let mockDb: any;
  let env: Bindings;

  beforeEach(() => {
    // Create mock database
    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    // Create environment
    env = {
      DB: {} as any, // Not used directly since we mock via middleware
      JWT_SECRET: 'test-jwt-secret',
      OAUTH_GITHUB_CLIENT_ID: 'test-github-id',
      OAUTH_GITHUB_CLIENT_SECRET: 'test-github-secret',
      OAUTH_GOOGLE_CLIENT_ID: 'test-google-id',
      OAUTH_GOOGLE_CLIENT_SECRET: 'test-google-secret',
    };

    // Create app with proper context
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Add database middleware (simulating the real app)
    app.use('*', async (c, next) => {
      c.set('db', mockDb);
      await next();
    });
    
    // Mount auth routes
    app.route('/auth', authRoutes);
  });

  describe('POST /auth/register', () => {
    it('should return 400 for invalid email', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'TestPass123!',
          username: 'testuser',
        }),
      }, env);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.details).toHaveProperty('email');
    });

    it('should return 400 for weak password', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'weak',
          username: 'testuser',
        }),
      }, env);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.details).toHaveProperty('password');
    });

    it('should return 409 when email already exists', async () => {
      // Mock existing user
      mockDb.select.mockReturnValue(
        createMockDbChain({
          id: 'existing-user-id',
          email: 'existing@example.com',
        })
      );

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
      const body = await res.json();
      expect(body.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should return 400 when username is taken', async () => {
      // First mock - no existing email
      mockDb.select.mockReturnValueOnce(createMockDbChain(null));
      
      // Second mock - existing username
      mockDb.select.mockReturnValueOnce(
        createMockDbChain({
          id: 'user-id',
          username: 'existinguser',
        })
      );

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'new@example.com',
          password: 'TestPass123!',
          username: 'existinguser',
        }),
      }, env);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.details).toHaveProperty('username', 'Username is already taken');
    });

    it('should create user and return tokens on success', async () => {
      // Mock no existing user
      mockDb.select.mockReturnValue(createMockDbChain(null));
      
      // Mock successful insert
      const newUser = {
        id: 'new-user-id',
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'hashed-password',
        weekStartDay: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newUser]),
        }),
      });

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
      const body = await res.json();
      
      // Check response structure
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body).toHaveProperty('user');
      expect(body.user).toMatchObject({
        email: 'newuser@example.com',
        username: 'newuser',
      });
      expect(body.user.id).toBeDefined();
      expect(typeof body.user.id).toBe('string');
      
      // Verify password was not included in response
      expect(body.user).not.toHaveProperty('password');
    });
  });

  describe('POST /auth/login', () => {
    it('should return 401 when user not found', async () => {
      mockDb.select.mockReturnValue(createMockDbChain(null));

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'TestPass123!',
        }),
      }, env);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('AUTHENTICATION_FAILED');
    });

    it('should return 401 for incorrect password', async () => {
      const hashedPassword = await hashPassword('CorrectPass123!');
      
      mockDb.select.mockReturnValue(
        createMockDbChain({
          id: 'user-id',
          email: 'user@example.com',
          username: 'testuser',
          password: hashedPassword,
          weekStartDay: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'WrongPass123!',
        }),
      }, env);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('AUTHENTICATION_FAILED');
    });

    it('should return tokens on successful login', async () => {
      const password = 'CorrectPass123!';
      const hashedPassword = await hashPassword(password);
      
      const user = {
        id: 'user-id',
        email: 'user@example.com',
        username: 'testuser',
        password: hashedPassword,
        enabled: true,
        weekStartDay: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockDb.select.mockReturnValue(createMockDbChain(user));
      
      // Mock successful refresh token insert
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnThis(),
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
      const body = await res.json();
      
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body).toHaveProperty('user');
      expect(body.user.email).toBe('user@example.com');
      expect(body.user).not.toHaveProperty('password');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 400 when refresh token is missing', async () => {
      const res = await app.request('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }, env);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for malformed token', async () => {
      const res = await app.request('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: 'not-a-jwt-token',
        }),
      }, env);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('INVALID_TOKEN');
    });
  });
});