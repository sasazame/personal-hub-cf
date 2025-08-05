import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
import type { KVNamespace } from '@cloudflare/workers-types';
import { createTestContext } from '../helpers/test-context';
import { asMockedDb } from '../helpers/mock-types';
import { securityHeaders } from '../../middleware/security-headers';
import authRoutes from '../../routes/auth';
import { cors } from 'hono/cors';

vi.mock('../../utils/auth', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn().mockResolvedValue(false), // Always return false for wrong password
  generateTokens: vi.fn(),
  verifyToken: vi.fn(),
}));

describe('Security Middleware Tests', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let ctx: ReturnType<typeof createTestContext>;

  beforeEach(async () => {
    ctx = createTestContext();
    
    // Mock KV namespace for rate limiting
    const mockKVStore: Record<string, string> = {};
    ctx.env.RATE_LIMITER = {
      get: vi.fn(async (key: string, options?: { type?: string }) => {
        const value = mockKVStore[key];
        if (!value) return null;
        // If type is 'json', parse the value
        if (options?.type === 'json') {
          return JSON.parse(value);
        }
        return value;
      }),
      put: vi.fn(async (key: string, value: string) => {
        mockKVStore[key] = value;
      }),
      delete: vi.fn(async (key: string) => {
        delete mockKVStore[key];
      }),
    } as unknown as KVNamespace;
    
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Apply security middleware
    app.use('*', securityHeaders);
    
    // Apply CORS middleware with test configuration
    app.use('*', cors({
      origin: (origin) => {
        const allowedOrigins = ['http://localhost:3000', 'https://allowed-domain.com'];
        return allowedOrigins.includes(origin || '') ? origin : null;
      },
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }));
    
    // Database middleware
    app.use('*', async (c, next) => {
      c.set('db', ctx.db);
      await next();
    });
    
    // Mount auth routes
    app.route('/api/v1/auth', authRoutes);
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const loginData = { email: 'test@example.com', password: 'wrongpassword' };
      
      // Mock database for login attempt
      const mockedDb = asMockedDb(ctx.db);
      mockedDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          id: 'test-user',
          email: 'test@example.com',
          password: 'hashed-password',
          enabled: true,
        }),
      }));
      
      // First request should succeed
      const res1 = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '192.168.1.1',
        },
        body: JSON.stringify(loginData),
      }, ctx.env);
      
      expect(res1.status).toBe(401); // Authentication failed, but not rate limited
      expect(res1.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(res1.headers.get('X-RateLimit-Remaining')).toBe('4');
    });

    it('should block requests exceeding rate limit', async () => {
      const loginData = { email: 'test@example.com', password: 'wrongpassword' };
      const ip = '192.168.1.2';
      
      // Mock database for login attempts
      const mockedDb = asMockedDb(ctx.db);
      mockedDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          id: 'test-user',
          email: 'test@example.com',
          password: 'hashed-password',
          enabled: true,
        }),
      }));
      
      // Make 5 requests to exceed the limit
      for (let i = 0; i < 5; i++) {
        await app.request('/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CF-Connecting-IP': ip,
          },
          body: JSON.stringify(loginData),
        }, ctx.env);
      }
      
      // 6th request should be rate limited
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': ip,
        },
        body: JSON.stringify(loginData),
      }, ctx.env);
      
      expect(res.status).toBe(429);
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(res.headers.get('Retry-After')).toBeDefined();
      
      const body = await res.json() as { code: string; message: string };
      expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(body.message).toContain('Too many authentication attempts');
    });

    it('should track rate limits per IP', async () => {
      const loginData = { email: 'test@example.com', password: 'wrongpassword' };
      
      // Mock database for login attempts
      const mockedDb = asMockedDb(ctx.db);
      mockedDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          id: 'test-user',
          email: 'test@example.com',
          password: 'hashed-password',
          enabled: true,
        }),
      }));
      
      // Make requests from different IPs
      const res1 = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '192.168.1.3',
        },
        body: JSON.stringify(loginData),
      }, ctx.env);
      
      const res2 = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '192.168.1.4',
        },
        body: JSON.stringify(loginData),
      }, ctx.env);
      
      // Both should have their own limits
      expect(res1.headers.get('X-RateLimit-Remaining')).toBe('4');
      expect(res2.headers.get('X-RateLimit-Remaining')).toBe('4');
    });
  });

  describe('Security Headers', () => {
    it('should set all required security headers', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      }, ctx.env);
      
      // Check all security headers
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
      expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(res.headers.get('Permissions-Policy')).toBe('geolocation=(), microphone=(), camera=()');
      
      // Check CSP header
      const csp = res.headers.get('Content-Security-Policy');
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain('upgrade-insecure-requests');
    });
  });

  describe('CORS Restrictions', () => {
    it('should allow requests from allowed origins', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
        },
      }, ctx.env);
      
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
      expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    });

    it('should block requests from disallowed origins', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://malicious-site.com',
          'Access-Control-Request-Method': 'POST',
        },
      }, ctx.env);
      
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('should allow requests without origin header', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      }, ctx.env);
      
      // Should not be blocked (allows mobile apps, etc.)
      expect(res.status).not.toBe(403);
    });
  });
});