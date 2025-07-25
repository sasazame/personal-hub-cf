import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import goalsRoutes from '../../routes/goals';
import { authMiddleware } from '../../middleware/auth';
import { generateTokens } from '../../utils/auth';
import { createMockDbChain } from '../helpers/test-context';
import type { Bindings, Variables } from '../../types';

describe('Goals Routes', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let mockDb: any;
  let env: Bindings;
  let validToken: string;
  let userId: string;

  beforeEach(async () => {
    // Setup
    userId = 'test-user-id';
    
    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      selectDistinct: vi.fn(),
    };

    env = {
      DB: {} as any,
      JWT_SECRET: 'test-jwt-secret',
      OAUTH_GITHUB_CLIENT_ID: 'test-github-id',
      OAUTH_GITHUB_CLIENT_SECRET: 'test-github-secret',
      OAUTH_GOOGLE_CLIENT_ID: 'test-google-id',
      OAUTH_GOOGLE_CLIENT_SECRET: 'test-google-secret',
    };

    // Generate valid token
    const tokens = await generateTokens(userId, env.JWT_SECRET);
    validToken = tokens.accessToken;

    // Create app
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Add database middleware
    app.use('*', async (c, next) => {
      c.set('db', mockDb);
      await next();
    });
    
    // Mount goals routes
    app.route('/goals', goalsRoutes);

    // Default mock for auth middleware user lookup
    mockDb.select.mockImplementation(() => {
      return createMockDbChain({
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        enabled: true,
      });
    });
  });

  describe('GET /goals', () => {
    it('should return empty array when no goals exist', async () => {
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Auth middleware user lookup
          return createMockDbChain({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            enabled: true,
          });
        } else {
          // Goals query
          return createMockDbChain([]);
        }
      });

      const res = await app.request('/goals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });

    it('should return user goals', async () => {
      const mockGoals = [
        {
          id: 1,
          userId,
          title: 'Learn TypeScript',
          description: 'Complete TypeScript course',
          goalType: 'SKILL',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Auth middleware user lookup
          return createMockDbChain({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            enabled: true,
          });
        } else {
          // Goals query
          return createMockDbChain(mockGoals);
        }
      });

      const res = await app.request('/goals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(1);
      expect(body[0].title).toBe('Learn TypeScript');
    });
  });

  describe('POST /goals', () => {
    it('should create a new goal', async () => {
      const newGoal = {
        id: 1,
        userId,
        title: 'New Goal',
        description: 'Goal description',
        goalType: 'PERSONAL',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newGoal]),
        }),
      });

      const res = await app.request('/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Goal',
          description: 'Goal description',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        }),
      }, env);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.title).toBe('New Goal');
      expect(body.userId).toBe(userId);
    });

    it('should return 400 for invalid input', async () => {
      const res = await app.request('/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
          description: 'Goal description',
        }),
      }, env);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /goals/:id', () => {
    it('should update goal', async () => {
      const existingGoal = {
        id: 1,
        userId,
        title: 'Existing Goal',
        description: 'Goal description',
        goalType: 'PERSONAL',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isActive: true,
      };

      let selectCallCount = 0;
      mockDb.select.mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // Auth middleware
          return createMockDbChain({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            enabled: true,
          });
        } else {
          // Goal lookup
          return createMockDbChain(existingGoal);
        }
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...existingGoal,
              description: 'Updated description',
            }]),
          }),
        }),
      });

      const res = await app.request('/goals/1', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Updated description',
        }),
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.description).toBe('Updated description');
    });
  });

  describe('DELETE /goals/:id', () => {
    it('should delete goal', async () => {
      let selectCallCount = 0;
      mockDb.select.mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // Auth middleware
          return createMockDbChain({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            enabled: true,
          });
        } else {
          // Goal lookup
          return createMockDbChain({
            id: 1,
            userId,
            title: 'Goal to delete',
          });
        }
      });

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnThis(),
      });

      const res = await app.request('/goals/1', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, env);

      expect(res.status).toBe(204);
      expect(res.body).toBeNull();
    });
  });
});