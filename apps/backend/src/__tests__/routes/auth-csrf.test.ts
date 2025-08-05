import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import authRoutes from '../../routes/auth';
import type { Bindings, Variables } from '../../types';

// Mock database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  get: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

// Mock nanoid to return predictable values
vi.mock('../../utils/nanoid', () => ({
  nanoid: vi.fn(() => 'test-id-123')
}));

// Mock createHash
vi.mock('../../utils/crypto', () => ({
  createHash: vi.fn((input: string) => Promise.resolve(`hashed-${input}`))
}));

// Mock auth utilities
vi.mock('../../utils/auth', () => ({
  hashPassword: vi.fn((password: string) => Promise.resolve(`hashed-${password}`)),
  verifyPassword: vi.fn(() => Promise.resolve(true)),
  generateTokens: vi.fn(() => Promise.resolve({
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token'
  })),
  verifyToken: vi.fn((token: string) => {
    if (token === 'valid-refresh-token') {
      return Promise.resolve({
        sub: 'user-123',
        type: 'refresh'
      });
    }
    throw new Error('Invalid token');
  })
}));

describe('Auth Routes - CSRF Token', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Add environment and database middleware
    app.use('*', async (c, next) => {
      // Set up environment
      c.env = {
        JWT_SECRET: 'test-secret',
        ENVIRONMENT: 'test',
      } as Bindings;
      c.set('db', mockDb as unknown as Variables['db']);
      await next();
    });
    
    // Mount auth routes
    app.route('/api/v1/auth', authRoutes);
  });

  describe('POST /register', () => {
    it('should return CSRF token in response', async () => {
      mockDb.get.mockResolvedValueOnce(null); // No existing user
      mockDb.get.mockResolvedValueOnce(null); // No existing username
      mockDb.values.mockResolvedValue({}); // Insert success
      
      const response = await app.request('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test@1234',
        }),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json() as { csrfToken: string; accessToken: string; refreshToken: string };
      
      // Check that response includes CSRF token
      expect(data.csrfToken).toBeDefined();
      expect(typeof data.csrfToken).toBe('string');
      expect(data.csrfToken.length).toBeGreaterThan(0);
      
      // Check that CSRF cookie is set
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('csrf-token=');
      expect(setCookieHeader).toContain('SameSite=Lax');
    });
  });

  describe('POST /login', () => {
    it('should return CSRF token in response', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed-Test@1234',
        enabled: true,
        email_verified: true,
        week_start_day: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      mockDb.get.mockResolvedValue(mockUser);
      mockDb.set.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.update.mockReturnThis();
      
      const response = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@1234',
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json() as { csrfToken: string; accessToken: string; refreshToken: string };
      
      // Check that response includes CSRF token
      expect(data.csrfToken).toBeDefined();
      expect(typeof data.csrfToken).toBe('string');
      expect(data.csrfToken.length).toBeGreaterThan(0);
      
      // Check that CSRF cookie is set
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('csrf-token=');
      expect(setCookieHeader).toContain('SameSite=Lax');
    });
  });

  describe('POST /refresh', () => {
    it('should return new CSRF token in response', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        enabled: true,
        email_verified: true,
        week_start_day: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const mockStoredToken = {
        id: 'token-123',
        tokenHash: 'hashed-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        revoked: false,
      };
      
      
      mockDb.get.mockResolvedValueOnce(mockStoredToken); // Token exists
      mockDb.get.mockResolvedValueOnce(mockUser); // User exists
      mockDb.set.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.update.mockReturnThis();
      
      const response = await app.request('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'refresh-token=valid-refresh-token',
        },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json() as { csrfToken: string; accessToken: string; refreshToken: string };
      
      // Check that response includes CSRF token
      expect(data.csrfToken).toBeDefined();
      expect(typeof data.csrfToken).toBe('string');
      expect(data.csrfToken.length).toBeGreaterThan(0);
      
      // Check that CSRF cookie is set
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('csrf-token=');
      expect(setCookieHeader).toContain('SameSite=Lax');
    });
  });
});