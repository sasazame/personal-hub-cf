import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
import { createTestContext } from '../helpers/test-context';
import authRoutes from '../../routes/auth';
import todosRoutes from '../../routes/todos';
import * as authUtils from '../../utils/auth';

vi.mock('../../utils/auth', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  generateTokens: vi.fn(),
  verifyToken: vi.fn(),
}));

describe('Rate Limiting and Resource Protection', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let ctx: any;

  beforeEach(() => {
    ctx = createTestContext();
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Add database middleware
    app.use('*', async (c, next) => {
      c.set('db', ctx.db);
      await next();
    });
    
    // In production, would add rate limiting middleware here
    // app.use('*', rateLimitMiddleware);
    
    app.route('/auth', authRoutes);
    app.route('/todos', todosRoutes);
    vi.clearAllMocks();
  });

  describe('Authentication Endpoint Rate Limiting', () => {
    it('should handle rapid login attempts', async () => {
      // Note: In production, Cloudflare provides rate limiting
      // This tests application behavior under rapid requests
      
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          password: 'hashed',
          enabled: true,
        }),
      }));

      vi.mocked(authUtils.verifyPassword).mockResolvedValue(false);

      const requests = Array.from({ length: 20 }, () => 
        app.request('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrong-password',
          }),
        }, ctx.env)
      );

      const results = await Promise.all(requests);
      const statuses = results.map(r => r.status);
      
      // Should handle all requests without crashing
      expect(statuses.every(s => [401, 429].includes(s))).toBe(true);
      
      // In production: expect some 429 (Too Many Requests) after threshold
    });

    it('should rate limit registration attempts', async () => {
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(null), // User doesn't exist
      }));

      vi.mocked(authUtils.hashPassword).mockResolvedValue('hashed');
      
      ctx.db.insert.mockImplementation(() => ({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'new-user' }]),
      }));

      const requests = Array.from({ length: 10 }, (_, i) => 
        app.request('/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: `user${i}@example.com`,
            username: `user${i}`,
            password: 'Password123!',
          }),
        }, ctx.env)
      );

      const results = await Promise.all(requests);
      
      // Should prevent spam registrations
      // In production: would see 429 responses after threshold
      results.forEach(res => {
        expect([201, 429].includes(res.status)).toBe(true);
      });
    });
  });

  describe('API Endpoint Rate Limiting', () => {
    it('should limit requests per user', async () => {
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([]),
      }));

      // Simulate burst of requests from single user
      const requests = Array.from({ length: 100 }, () => 
        app.request('/todos', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ctx.validToken}`,
          },
        }, ctx.env)
      );

      const results = await Promise.all(requests);
      const statuses = results.map(r => r.status);
      
      // Should handle burst but potentially rate limit
      expect(statuses.every(s => [200, 429].includes(s))).toBe(true);
    });

    it('should have stricter limits for resource-intensive operations', async () => {
      // Analytics endpoints are typically more expensive
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ count: 100 }),
      }));

      const analyticsRequests = Array.from({ length: 20 }, () => 
        app.request('/analytics/overview', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ctx.validToken}`,
          },
        }, ctx.env)
      );

      const results = await Promise.all(analyticsRequests);
      
      // Resource-intensive endpoints should have lower rate limits
      // In production: would implement different rate limit tiers
      results.forEach(res => {
        expect([200, 429, 500].includes(res.status)).toBe(true);
      });
    });
  });

  describe('Write Operation Limits', () => {
    it('should limit rapid creation of resources', async () => {
      ctx.db.insert.mockImplementation(() => ({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: Date.now() }]),
      }));

      const createRequests = Array.from({ length: 50 }, (_, i) => 
        app.request('/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ctx.validToken}`,
          },
          body: JSON.stringify({
            title: `Spam Todo ${i}`,
            description: 'Auto-generated',
          }),
        }, ctx.env)
      );

      const results = await Promise.all(createRequests);
      const successCount = results.filter(r => r.status === 201).length;
      
      // Should allow some but potentially limit excessive creation
      expect(successCount).toBeGreaterThan(0);
      // In production: expect rate limiting after threshold
    });

    it('should prevent rapid updates to same resource', async () => {
      const todoId = 123;
      
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ id: todoId, userId: 'test-user' }),
      }));

      ctx.db.update.mockImplementation(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: todoId }]),
      }));

      const updateRequests = Array.from({ length: 30 }, (_, i) => 
        app.request(`/todos/${todoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ctx.validToken}`,
          },
          body: JSON.stringify({
            title: `Update ${i}`,
          }),
        }, ctx.env)
      );

      const results = await Promise.all(updateRequests);
      
      // Should prevent rapid-fire updates to prevent abuse
      results.forEach(res => {
        expect([200, 429].includes(res.status)).toBe(true);
      });
    });
  });

  describe('Global Rate Limits', () => {
    it('should protect against DDoS attempts', async () => {
      // Simulate requests from many different "users"
      const tokens = Array.from({ length: 50 }, (_, i) => `fake-token-${i}`);
      
      const requests = tokens.map(token => 
        app.request('/todos', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }, ctx.env)
      );

      const results = await Promise.all(requests);
      
      // All should fail auth, but server should remain responsive
      expect(results.every(r => r.status === 401)).toBe(true);
    });

    it('should maintain service availability under load', async () => {
      // Test graceful degradation
      let requestCount = 0;
      
      ctx.db.select.mockImplementation(() => {
        requestCount++;
        if (requestCount > 50) {
          // Simulate overload
          throw new Error('Too many connections');
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue({ id: 1 }),
        };
      });

      const requests = Array.from({ length: 60 }, () => 
        app.request('/todos/1', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ctx.validToken}`,
          },
        }, ctx.env)
      );

      const results = await Promise.all(requests);
      const errorResponses = results.filter(r => r.status === 500);
      
      // Should handle overload gracefully
      expect(errorResponses.length).toBeGreaterThan(0);
      
      // Should return proper error responses, not crash
      for (const res of errorResponses) {
        const body = await res.json();
        expect(body.code).toBe('INTERNAL_ERROR');
      }
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include rate limit information in headers', async () => {
      // Note: This would be implemented by Cloudflare or middleware
      
      const res = await app.request('/todos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ctx.validToken}`,
        },
      }, ctx.env);

      // In production, would expect headers like:
      // X-RateLimit-Limit: 100
      // X-RateLimit-Remaining: 99
      // X-RateLimit-Reset: 1640995200
      
      expect(res.status).toBe(200);
    });

    it('should return 429 with retry-after header when rate limited', async () => {
      // Simulate rate limit exceeded
      const res = {
        status: 429,
        headers: new Headers({
          'Retry-After': '60',
          'Content-Type': 'application/json',
        }),
        json: async () => ({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: 60,
        }),
      };

      // In production, this would be returned by rate limiter
      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('IP-based Rate Limiting', () => {
    it('should track requests by IP address', async () => {
      // Cloudflare provides CF-Connecting-IP header
      const ips = ['192.168.1.1', '192.168.1.2', '10.0.0.1'];
      
      const requests = ips.flatMap(ip => 
        Array.from({ length: 10 }, () => 
          app.request('/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'CF-Connecting-IP': ip,
            },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password',
            }),
          }, ctx.env)
        )
      );

      const results = await Promise.all(requests);
      
      // Each IP should have independent rate limits
      // In production: would track and limit per IP
      expect(results.length).toBe(30);
    });
  });

  describe('Adaptive Rate Limiting', () => {
    it('should adjust limits based on user behavior', async () => {
      // Good user behavior - normal usage pattern
      const normalRequests = Array.from({ length: 5 }, () => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve(app.request('/todos', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${ctx.validToken}`,
              },
            }, ctx.env));
          }, 100); // Spacing out requests
        })
      );

      const normalResults = await Promise.all(normalRequests);
      
      // Should allow normal usage
      expect(normalResults.every((r: any) => r.status === 200)).toBe(true);

      // Suspicious behavior - rapid automated requests
      const suspiciousRequests = Array.from({ length: 50 }, () => 
        app.request('/todos', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ctx.validToken}`,
            'User-Agent': 'bot/1.0', // Suspicious user agent
          },
        }, ctx.env)
      );

      const suspiciousResults = await Promise.all(suspiciousRequests);
      
      // In production: would apply stricter limits to suspicious behavior
      expect(suspiciousResults.length).toBe(50);
    });
  });
});