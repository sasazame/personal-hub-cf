import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
import { createTestContext, createMockDbChain } from '../helpers/test-context';
import * as jwt from '@tsndr/cloudflare-worker-jwt';
import todosRoutes from '../../routes/todos';
import notesRoutes from '../../routes/notes';
import momentsRoutes from '../../routes/moments';

describe('Large Payload Edge Cases', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let ctx: any;
  let validToken: string;
  const userId = 'test-user';

  // Helper to setup database mock with auth
  const setupDbMock = () => {
    let callCount = 0;
    ctx.db.select.mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockImplementation(() => {
        callCount++;
        // Always return user for auth middleware
        return Promise.resolve({
          id: userId,
          email: 'test@example.com',
          username: 'testuser',
          enabled: true,
        });
      }),
    }));
  };

  // Helper to setup auth and custom db behavior
  const setupDbWithAuth = (customMocks: any) => {
    let selectCallCount = 0;
    
    // Handle select with auth
    if (customMocks.select) {
      ctx.db.select.mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // Auth middleware
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
        return customMocks.select();
      });
    } else {
      setupDbMock();
    }
    
    // Apply other custom mocks
    if (customMocks.insert) ctx.db.insert.mockImplementation(customMocks.insert);
    if (customMocks.update) ctx.db.update.mockImplementation(customMocks.update);
    if (customMocks.delete) ctx.db.delete.mockImplementation(customMocks.delete);
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
    
    app.route('/todos', todosRoutes);
    app.route('/notes', notesRoutes);
    app.route('/moments', momentsRoutes);
    
    // Setup default database mock for auth
    setupDbMock();
  });

  describe('Request Size Limits', () => {
    it('should handle very long titles gracefully', async () => {
      const longTitle = 'A'.repeat(1000); // 1KB title
      
      const res = await app.request('/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          title: longTitle,
          description: 'Normal description',
        }),
      }, ctx.env);

      // Should either accept (if within limits) or reject with 400
      expect([201, 400].includes(res.status)).toBe(true);
      
      if (res.status === 400) {
        const body = await res.json();
        expect(body.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject extremely large payloads', async () => {
      // 10MB payload
      const hugeContent = 'X'.repeat(10 * 1024 * 1024);
      
      const res = await app.request('/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          title: 'Note',
          content: hugeContent,
        }),
      }, ctx.env);

      // Should reject large payloads
      expect([400, 413, 500].includes(res.status)).toBe(true);
    });

    it('should handle deeply nested JSON structures', async () => {
      let deeplyNested = { value: 'test' };
      for (let i = 0; i < 100; i++) {
        deeplyNested = { nested: deeplyNested };
      }

      const res = await app.request('/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          title: 'Test',
          description: JSON.stringify(deeplyNested),
        }),
      }, ctx.env);

      // Should handle without stack overflow
      expect([201, 400].includes(res.status)).toBe(true);
    });
  });

  describe('Array Size Limits', () => {
    it('should handle requests with many tags', async () => {
      const manyTags = Array.from({ length: 100 }, (_, i) => `tag${i}`).join(',');
      
      ctx.db.insert.mockImplementation(() => ({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 1,
          tags: manyTags,
        }]),
      }));

      const res = await app.request('/moments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          content: 'Test moment',
          tags: manyTags,
        }),
      }, ctx.env);

      expect([201, 400].includes(res.status)).toBe(true);
    });

    it('should handle batch operations with many items', async () => {
      // Note: Current API doesn't support batch operations
      // This tests what would happen with many sequential requests
      
      const promises = Array.from({ length: 50 }, (_, i) => 
        app.request('/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validToken}`,
          },
          body: JSON.stringify({
            title: `Todo ${i}`,
            description: 'Batch created',
          }),
        }, ctx.env)
      );

      const results = await Promise.all(promises);
      
      // All should complete (either success or rate limited)
      results.forEach(res => {
        expect([201, 400, 429].includes(res.status)).toBe(true);
      });
    });
  });

  describe('Response Size Handling', () => {
    it('should paginate large result sets', async () => {
      // Mock returning many items
      const manyItems = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `Todo ${i}`,
        userId: 'test-user',
      }));

      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn((limit) => {
          expect(limit).toBeLessThanOrEqual(100); // Should have reasonable limit
          return {
            offset: vi.fn().mockResolvedValue(manyItems.slice(0, limit)),
          };
        }),
      }));

      const res = await app.request('/todos?limit=1000', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      // Should enforce maximum page size
      expect(body.items.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Unicode and Special Characters', () => {
    it('should handle full Unicode range', async () => {
      const unicodePayloads = [
        '😀😃😄😁😆😅🤣😂', // Emojis
        '中文测试', // Chinese
        'العربية', // Arabic
        '🏳️‍🌈🏴‍☠️🏁', // Complex emojis
        '\u0000\u0001\u0002', // Control characters
        '¡™£¢∞§¶•ªº', // Special symbols
      ];

      for (const payload of unicodePayloads) {
        ctx.db.insert.mockImplementation(() => ({
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            content: payload,
          }]),
        }));

        const res = await app.request('/moments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${validToken}`,
          },
          body: JSON.stringify({
            content: payload,
          }),
        }, ctx.env);

        expect([201, 400].includes(res.status)).toBe(true);
        
        if (res.status === 201) {
          const body = await res.json();
          expect(body.content).toBe(payload);
        }
      }
    });

    it('should handle mixed text directions', async () => {
      const mixedDirection = 'Hello مرحبا World עולם Test';
      
      ctx.db.insert.mockImplementation(() => ({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 1,
          title: mixedDirection,
        }]),
      }));

      const res = await app.request('/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          title: mixedDirection,
          content: 'Test',
        }),
      }, ctx.env);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.title).toBe(mixedDirection);
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle minimum and maximum integer values', async () => {
      const boundaryTests = [
        { priority: 'HIGH', dueDate: '1970-01-01' }, // Minimum date
        { priority: 'LOW', dueDate: '9999-12-31' }, // Maximum date
        { parentId: 0 }, // Minimum ID
        { parentId: 2147483647 }, // Maximum 32-bit integer
      ];

      for (const testData of boundaryTests) {
        const res = await app.request('/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validToken}`,
          },
          body: JSON.stringify({
            title: 'Boundary test',
            ...testData,
          }),
        }, ctx.env);

        expect([201, 400].includes(res.status)).toBe(true);
      }
    });

    it('should handle empty and whitespace-only inputs', async () => {
      const emptyInputs = [
        { title: '', description: 'Valid' }, // Empty title
        { title: '   ', description: 'Valid' }, // Whitespace only
        { title: 'Valid', tags: '' }, // Empty tags
        { title: 'Valid', description: null }, // Null values
      ];

      for (const input of emptyInputs) {
        const res = await app.request('/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validToken}`,
          },
          body: JSON.stringify(input),
        }, ctx.env);

        // Should validate required fields
        if (!input.title || !input.title.trim()) {
          expect(res.status).toBe(400);
        }
      }
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle simultaneous updates to same resource', async () => {
      const todoId = 123;
      
      // Simulate concurrent updates
      const updates = Array.from({ length: 10 }, (_, i) => ({
        title: `Update ${i}`,
        status: i % 2 === 0 ? 'DONE' : 'IN_PROGRESS',
      }));

      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ id: todoId, userId: 'test-user' }),
      }));

      ctx.db.update.mockImplementation(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn((values) => Promise.resolve([values])),
      }));

      const promises = updates.map(update =>
        app.request(`/todos/${todoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validToken}`,
          },
          body: JSON.stringify(update),
        }, ctx.env)
      );

      const results = await Promise.all(promises);
      
      // All should complete successfully (last write wins)
      results.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should handle malformed JSON gracefully', async () => {
      const malformedPayloads = [
        '{"title": "Test", "description": "Missing closing brace"',
        '{"title": "Test" "description": "Missing comma"}',
        '{title: "Test"}', // Unquoted key
        "{'title': 'Single quotes'}", // Single quotes
        '{"title": "Test", "extra": }', // Invalid value
      ];

      for (const payload of malformedPayloads) {
        const res = await app.request('/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validToken}`,
          },
          body: payload,
        }, ctx.env);

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.code).toBeDefined();
      }
    });

    it('should handle database connection failures', async () => {
      ctx.db.select.mockImplementation(() => {
        throw new Error('Connection timeout');
      });

      const res = await app.request('/todos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.code).toBe('INTERNAL_ERROR');
      // Should not expose internal error details
      expect(body.message).not.toContain('Connection timeout');
    });
  });
});