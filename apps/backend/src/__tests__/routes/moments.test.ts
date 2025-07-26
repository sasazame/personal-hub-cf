import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import momentsRoutes from '../../routes/moments';
import type { Bindings, Variables } from '../../types';
import { createTestContext, createMockDbChain } from '../helpers/test-context';
import * as jwt from '@tsndr/cloudflare-worker-jwt';

describe('Moments Routes', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let ctx: any;
  let validToken: string;
  const userId = 'test-user';

  // Helper to setup database mock with auth
  const setupDbMock = (dataReturns: any) => {
    let callCount = 0;
    ctx.db.select.mockImplementation(() => {
      callCount++;
      
      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockImplementation(() => {
          if (callCount === 1) {
            // Auth middleware user lookup
            return Promise.resolve({
              id: userId,
              email: 'test@example.com',
              username: 'testuser',
              enabled: true,
            });
          }
          // Subsequent calls for test data
          return Promise.resolve(dataReturns);
        }),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(dataReturns),
      };
      
      // For queries that are awaited directly (return arrays)
      if (callCount > 1 && Array.isArray(dataReturns)) {
        // Keep the chain intact - where() returns the chain, orderBy() returns the result
        mockChain.orderBy = vi.fn().mockResolvedValue(dataReturns);
        // Also create a thenable chain for when where() is the final method
        Object.assign(mockChain, {
          then: (resolve: any) => Promise.resolve(dataReturns).then(resolve),
        });
      }
      
      return mockChain;
    });
  };

  // Helper for paginated queries (used by GET /moments)
  const setupPaginatedDbMock = (items: any[], total: number = items.length) => {
    let callCount = 0;
    ctx.db.select.mockImplementation(() => {
      callCount++;
      
      if (callCount === 1) {
        // Auth middleware user lookup
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            enabled: true,
          }),
        };
      } else if (callCount === 2) {
        // First query in Promise.all - get items
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockResolvedValue(items),
        };
      } else {
        // Second query in Promise.all - count
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ count: total }]),
        };
      }
    });
  };

  beforeEach(async () => {
    ctx = createTestContext();
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Generate valid token using jwt directly
    validToken = await jwt.sign(
      {
        sub: userId,
        type: 'access',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      ctx.env.JWT_SECRET
    );
    
    // Add database middleware
    app.use('*', async (c, next) => {
      c.set('db', ctx.db);
      await next();
    });
    
    app.route('/moments', momentsRoutes);
    
    // Default mock for auth middleware user lookup
    ctx.db.select.mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        enabled: true,
      }),
    }));
  });

  describe('Authentication', () => {
    it('should return 401 for missing token', async () => {
      const res = await app.request('/moments', {
        method: 'GET',
      }, ctx.env);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for invalid token', async () => {
      const res = await app.request('/moments', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      }, ctx.env);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /moments', () => {
    it('should return paginated moments', async () => {
      const mockMoments = [
        { id: 1, content: 'Moment 1', tags: 'reflection', userId: 'test-user', createdAt: '2025-01-26T10:00:00Z' },
        { id: 2, content: 'Moment 2', tags: 'gratitude', userId: 'test-user', createdAt: '2025-01-26T09:00:00Z' },
      ];

      setupPaginatedDbMock(mockMoments);

      const res = await app.request('/moments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body).toHaveProperty('items');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('page');
      expect(body).toHaveProperty('limit');
      expect(body).toHaveProperty('totalPages');
      expect(body.items).toEqual(mockMoments);
    });

    it('should filter moments by search query', async () => {
      setupPaginatedDbMock([]);

      const res = await app.request('/moments?search=gratitude', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual([]);
    });

    it('should filter moments by tags', async () => {
      const mockMoments = [
        { id: 1, content: 'Grateful moment', tags: 'gratitude,reflection', userId: 'test-user' },
      ];

      setupPaginatedDbMock(mockMoments);

      const res = await app.request('/moments?tags=gratitude,learning', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual(mockMoments);
    });

    it('should filter moments by date range', async () => {
      setupPaginatedDbMock([]);

      const res = await app.request('/moments?fromDate=2025-01-01&toDate=2025-01-31', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
    });

    it('should handle pagination parameters', async () => {
      setupPaginatedDbMock([]);

      const res = await app.request('/moments?page=2&limit=5', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /moments/today', () => {
    it('should return today\'s moments', async () => {
      const today = new Date();
      const mockMoments = [
        { id: 1, content: 'Morning reflection', createdAt: today.toISOString() },
        { id: 2, content: 'Evening gratitude', createdAt: today.toISOString() },
      ];

      setupDbMock(mockMoments);

      const res = await app.request('/moments/today', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toEqual(mockMoments);
    });

    it('should return empty array when no moments today', async () => {
      setupDbMock([]);

      const res = await app.request('/moments/today', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });
  });

  describe('GET /moments/tags', () => {
    it('should return tag counts', async () => {
      setupDbMock([
        { tags: 'gratitude,reflection' },
        { tags: 'gratitude,learning' },
        { tags: 'reflection' },
      ]);

      const res = await app.request('/moments/tags', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(Array.isArray(body)).toBe(true);
      expect(body.find(t => t.tag === 'gratitude')?.count).toBe(2);
      expect(body.find(t => t.tag === 'reflection')?.count).toBe(2);
      expect(body.find(t => t.tag === 'learning')?.count).toBe(1);
      expect(body[0].count).toBeGreaterThanOrEqual(body[1].count); // Sorted by count
    });

    it('should handle empty tags gracefully', async () => {
      setupDbMock([
        { tags: null },
        { tags: '' },
        { tags: '  ,  , ' },
      ]);

      const res = await app.request('/moments/tags', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });
  });

  describe('GET /moments/tags/default', () => {
    it('should return default tags with counts', async () => {
      setupDbMock([
        { tags: 'gratitude,custom1' },
        { tags: 'gratitude,achievement' },
        { tags: 'custom1,custom2' },
      ]);

      const res = await app.request('/moments/tags/default', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      // Should include default tags
      expect(body.find(t => t.tag === 'gratitude')).toBeDefined();
      expect(body.find(t => t.tag === 'achievement')).toBeDefined();
      expect(body.find(t => t.tag === 'reflection')).toBeDefined();
      expect(body.find(t => t.tag === 'learning')).toBeDefined();
      expect(body.find(t => t.tag === 'milestone')).toBeDefined();
      
      // Should include user's custom tags
      expect(body.find(t => t.tag === 'custom1')).toBeDefined();
      expect(body.find(t => t.tag === 'custom2')).toBeDefined();
      
      // Verify counts
      expect(body.find(t => t.tag === 'gratitude')?.count).toBe(2);
      expect(body.find(t => t.tag === 'custom1')?.count).toBe(2);
    });
  });

  describe('GET /moments/stats', () => {
    it('should return moment statistics', async () => {
      const dates = ['2025-01-26', '2025-01-26', '2025-01-25', '2025-01-25', '2025-01-25'];
      const mockMoments = dates.map((date, i) => ({
        id: i,
        createdAt: date + 'T10:00:00Z',
      }));

      setupDbMock(mockMoments);

      const res = await app.request('/moments/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.totalMoments).toBe(5);
      expect(body.daysWithMoments).toBe(2);
      expect(body.averagePerDay).toBeCloseTo(5 / 30, 2);
      expect(body.maxPerDay).toBe(3);
      expect(body.momentsByDate['2025-01-26']).toBe(2);
      expect(body.momentsByDate['2025-01-25']).toBe(3);
    });

    it('should accept custom days parameter', async () => {
      setupDbMock([]);

      const res = await app.request('/moments/stats?days=7', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.totalMoments).toBe(0);
      expect(body.averagePerDay).toBe(0);
    });
  });

  describe('GET /moments/:id', () => {
    it('should return specific moment', async () => {
      const mockMoment = {
        id: 1,
        content: 'Test moment',
        tags: 'test',
        userId: 'test-user',
      };

      setupDbMock(mockMoment);

      const res = await app.request('/moments/1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(mockMoment);
    });

    it('should return 404 for non-existent moment', async () => {
      setupDbMock(null);

      const res = await app.request('/moments/999', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /moments', () => {
    it('should create a new moment', async () => {
      const momentData = {
        content: 'Today I learned something new',
        tags: 'learning,achievement',
      };

      ctx.db.insert.mockImplementation(() => ({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 1,
          ...momentData,
          userId: 'test-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]),
      }));

      const res = await app.request('/moments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify(momentData),
      }, ctx.env);

      expect(res.status).toBe(201);
      const body = await res.json();
      
      expect(body.content).toBe(momentData.content);
      expect(body.tags).toBe(momentData.tags);
      expect(body.userId).toBe('test-user');
    });

    it('should validate required fields', async () => {
      const res = await app.request('/moments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({}),
      }, ctx.env);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should allow empty tags', async () => {
      const momentData = {
        content: 'Simple moment without tags',
      };

      ctx.db.insert.mockImplementation(() => ({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 1,
          ...momentData,
          tags: null,
          userId: 'test-user',
        }]),
      }));

      const res = await app.request('/moments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify(momentData),
      }, ctx.env);

      expect(res.status).toBe(201);
    });
  });

  describe('PUT /moments/:id', () => {
    it('should update existing moment', async () => {
      const existingMoment = {
        id: 1,
        content: 'Original content',
        tags: 'original',
        userId: 'test-user',
      };

      const updateData = {
        content: 'Updated content',
        tags: 'updated,modified',
      };

      setupDbMock(existingMoment);

      ctx.db.update.mockImplementation(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          ...existingMoment,
          ...updateData,
          updatedAt: new Date().toISOString(),
        }]),
      }));

      const res = await app.request('/moments/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify(updateData),
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.content).toBe(updateData.content);
      expect(body.tags).toBe(updateData.tags);
    });

    it('should return 404 for non-existent moment', async () => {
      setupDbMock(null);

      const res = await app.request('/moments/999', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({ content: 'Updated' }),
      }, ctx.env);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /moments/:id', () => {
    it('should delete existing moment', async () => {
      setupDbMock({ id: 1 });

      ctx.db.delete.mockImplementation(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      }));

      const res = await app.request('/moments/1', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent moment', async () => {
      setupDbMock(null);

      const res = await app.request('/moments/999', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      let callCount = 0;
      ctx.db.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Auth middleware user lookup - let it pass
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            get: vi.fn().mockResolvedValue({
              id: userId,
              email: 'test@example.com',
              username: 'testuser',
              enabled: true,
            }),
          };
        }
        // After auth, throw error
        throw new Error('Database connection failed');
      });

      const res = await app.request('/moments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.code).toBe('INTERNAL_ERROR');
    });
  });
});