import { describe, it, expect, beforeEach, vi } from 'vitest';
import authRoutes from '../../routes/auth';
import { createTestContext, createMockDbChain } from '../helpers/test-context';
import { asMockedDb } from '../helpers/mock-types';
import { hashPassword } from '../../utils/auth';
import type { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
import type { ErrorResponse, CookieAuthResponse } from '../helpers/response-types';

describe('Auth Routes', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let env: Bindings;
  let mockDb: ReturnType<typeof createTestContext>['db'];

  beforeEach(() => {
    const testContext = createTestContext();
    app = testContext.app;
    env = testContext.env;
    mockDb = testContext.db;
    
    app.route('/auth', authRoutes);
  });

  describe('POST /auth/register', () => {
    it('should return 400 for invalid input', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'weak',
          username: 'ab', // too short
        }),
      }, env);

      expect(res.status).toBe(400);
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.details).toBeDefined();
    });

    it('should return 400 for missing fields', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }, env);

      expect(res.status).toBe(400);
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for existing user', async () => {
      // Mock existing user
      const mockedDb = asMockedDb(mockDb);
      mockedDb.select.mockReturnValue(
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
          username: 'existinguser',
        }),
      }, env);

      expect(res.status).toBe(409);
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should return 201 for successful registration', async () => {
      // Mock no existing user
      const mockedDb = asMockedDb(mockDb);
      mockedDb.select.mockReturnValue(createMockDbChain(null));
      
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
      mockedDb.insert.mockReturnValue({
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
      const body = await res.json() as CookieAuthResponse;
      expect(body.user).toBeDefined();
      expect(body.csrfToken).toBeDefined();
      expect(body.user.email).toBe('newuser@example.com');
      
      // Check that auth cookies are set
      const setCookieHeaders = res.headers.getSetCookie();
      expect(setCookieHeaders).toBeDefined();
      expect(setCookieHeaders.some(h => h.includes('access-token='))).toBe(true);
      expect(setCookieHeaders.some(h => h.includes('refresh-token='))).toBe(true);
      expect(setCookieHeaders.some(h => h.includes('session-id='))).toBe(true);
    });
  });

  describe('POST /auth/login', () => {
    it('should return 400 for missing credentials', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }, env);

      expect(res.status).toBe(400);
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for non-existent user', async () => {
      // Mock no user found
      const mockedDb = asMockedDb(mockDb);
      mockedDb.select.mockReturnValue(createMockDbChain(null));

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'TestPass123!',
        }),
      }, env);

      expect(res.status).toBe(401);
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('AUTHENTICATION_FAILED');
    });

    it('should return 401 for wrong password', async () => {
      const hashedPassword = await hashPassword('CorrectPass123!');
      
      // Mock user found
      const mockedDb = asMockedDb(mockDb);
      mockedDb.select.mockReturnValue(
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
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('AUTHENTICATION_FAILED');
    });

    it('should return 200 for successful login', async () => {
      const password = 'CorrectPass123!';
      const hashedPassword = await hashPassword(password);
      
      // Mock user found
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
      
      const mockedDb = asMockedDb(mockDb);
      mockedDb.select.mockReturnValue(createMockDbChain({
        ...user,
        enabled: true
      }));
      
      // Mock update for refresh token revocation
      mockedDb.update.mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      });
      
      // Mock successful refresh token insert
      mockedDb.insert.mockReturnValue({
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
      const body = await res.json() as CookieAuthResponse;
      expect(body.user).toBeDefined();
      expect(body.csrfToken).toBeDefined();
      expect(body.user.email).toBe('user@example.com');
      
      // Check that auth cookies are set
      const setCookieHeaders = res.headers.getSetCookie();
      expect(setCookieHeaders).toBeDefined();
      expect(setCookieHeaders.some(h => h.includes('access-token='))).toBe(true);
      expect(setCookieHeaders.some(h => h.includes('refresh-token='))).toBe(true);
      expect(setCookieHeaders.some(h => h.includes('session-id='))).toBe(true);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 401 for missing token', async () => {
      const res = await app.request('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, env);

      expect(res.status).toBe(401);
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('INVALID_TOKEN');
    });

    it('should return 401 for invalid token format', async () => {
      const res = await app.request('/auth/refresh', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': 'refresh-token=invalid.jwt.token',
        },
      }, env);

      expect(res.status).toBe(401);
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('INVALID_TOKEN');
    });
  });
});