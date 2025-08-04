import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import analyticsRoutes from '../../routes/analytics';
import type { Bindings, Variables } from '../../types';
import { createTestContext, createMockDbChain } from '../helpers/test-context';
import { asMockedDb } from '../helpers/mock-types';
import { generateTokens } from '../../utils/auth';
import * as jwt from '@tsndr/cloudflare-worker-jwt';

// Response type interfaces
interface AnalyticsOverviewResponse {
  todos: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    completionRate: number;
  };
  goals: {
    total: number;
    active: number;
  };
  pomodoro: {
    totalSessions: number;
    completedSessions: number;
    totalCycles: number;
  };
  events: unknown;
  notes: unknown;
  moments: unknown;
}

interface ProductivityResponse {
  completedTodosByDate: Array<{ date: string; count: number }>;
  goalAchievementsByDate: Array<{ date: string; count: number }>;
  pomodoroByDate: Array<{ date: string; sessions: number; cycles: number }>;
}

interface HabitsResponse {
  currentStreak: number;
  longestStreak: number;
  mostProductiveHours: number[];
  mostProductiveDays: number[];
  activityDates: string[];
}

interface GoalProgress {
  id: number;
  title: string;
  totalDays: number;
  elapsedDays: number;
  progressPercentage: number;
  isOnTrack: boolean;
  achievementCount?: number;
}

interface TagsResponse {
  tags: Array<{ tag: string; notes: number; moments: number; total: number }>;
  totalUniqueTags: number;
  mostUsedTag: string | null;
}

interface TimeDistributionResponse {
  hourlyDistribution: Array<{
    hour: number;
    todos: number;
    pomodoro: number;
    events: number;
  }>;
  weekdayDistribution: Array<{
    weekday: number;
    todos: number;
    pomodoro: number;
    events: number;
  }>;
}

describe('Analytics Routes', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let ctx: ReturnType<typeof createTestContext>;
  let validToken: string;
  const userId = 'test-user';

  // Helper to setup database mock with auth
  const setupDbMock = (dataReturns: unknown) => {
    const mockedDb = asMockedDb(ctx.db);
    let callCount = 0;
    mockedDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Auth middleware user lookup
        return createMockDbChain({
          id: userId,
          email: 'test@example.com',
          username: 'testuser',
          enabled: true,
        });
      }
      // Subsequent calls return the test data
      return createMockDbChain(dataReturns);
    });
  };

  // Helper for complex query mocks (with joins, groupBy, etc)
  const setupComplexDbMock = (mockChain: ReturnType<typeof createMockDbChain>) => {
    const mockedDb = asMockedDb(ctx.db);
    let callCount = 0;
    mockedDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Auth middleware user lookup
        return createMockDbChain({
          id: userId,
          email: 'test@example.com',
          username: 'testuser',
          enabled: true,
        });
      }
      // Return custom mock chain for complex queries
      return mockChain;
    });
  };

  beforeEach(async () => {
    ctx = createTestContext();
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Generate valid token
    const tokens = await generateTokens(userId, ctx.env.JWT_SECRET);
    validToken = tokens.accessToken;
    
    // Add database middleware
    app.use('*', async (c, next) => {
      c.set('db', ctx.db);
      await next();
    });
    
    app.route('/analytics', analyticsRoutes);
    
    // Default mock for auth middleware user lookup
    const mockedDb = asMockedDb(ctx.db);
    mockedDb.select.mockImplementation(() => ({
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
      const res = await app.request('/analytics/overview', {
        method: 'GET',
      }, ctx.env);

      expect(res.status).toBe(401);
      const body = await res.json() as { code: string; message?: string };
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for invalid token', async () => {
      // Create a token with invalid signature
      const invalidToken = await jwt.sign(
        { sub: 'user-123', type: 'access', exp: Math.floor(Date.now() / 1000) + 3600 },
        'wrong-secret'
      );
      
      const res = await app.request('/analytics/overview', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${invalidToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /analytics/overview', () => {
    it('should return analytics overview', async () => {
      // Mock database queries
      setupDbMock({
        total: 10,
        completed: 5,
        inProgress: 3,
        todo: 2,
        active: 1,
        totalSessions: 15,
        completedSessions: 12,
        totalCycles: 48,
        upcoming: 3,
        today: 2,
      });

      const res = await app.request('/analytics/overview', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as AnalyticsOverviewResponse;
      
      expect(body).toHaveProperty('todos');
      expect(body.todos).toEqual({
        total: 10,
        completed: 5,
        inProgress: 3,
        todo: 2,
        completionRate: 0.5,
      });
      
      expect(body).toHaveProperty('goals');
      expect(body.goals).toEqual({
        total: 10,
        active: 1,
      });
      
      expect(body).toHaveProperty('pomodoro');
      expect(body.pomodoro).toEqual({
        totalSessions: 15,
        completedSessions: 12,
        totalCycles: 48,
      });
      
      expect(body).toHaveProperty('events');
      expect(body).toHaveProperty('notes');
      expect(body).toHaveProperty('moments');
    });

    it('should handle empty results gracefully', async () => {
      setupDbMock(null);

      const res = await app.request('/analytics/overview', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as AnalyticsOverviewResponse;
      
      expect(body.todos.total).toBe(0);
      expect(body.todos.completionRate).toBe(0);
      expect(body.goals.total).toBe(0);
    });

    it('should handle database errors', async () => {
      const mockedDb = asMockedDb(ctx.db);
      let callCount = 0;
      mockedDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Auth middleware user lookup
          return createMockDbChain({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            enabled: true,
          });
        }
        // Database error for analytics query
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          get: vi.fn().mockRejectedValue(new Error('Database error')),
        };
      });

      const res = await app.request('/analytics/overview', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(500);
      const body = await res.json() as { code: string; message?: string };
      expect(body.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('GET /analytics/productivity', () => {
    it('should return productivity data for date range', async () => {
      setupComplexDbMock({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockResolvedValue([
          { date: '2025-01-20', count: 5 },
          { date: '2025-01-21', count: 3 },
        ]),
      });

      const res = await app.request('/analytics/productivity?fromDate=2025-01-20&toDate=2025-01-27', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as ProductivityResponse;
      
      expect(body).toHaveProperty('completedTodosByDate');
      expect(body).toHaveProperty('goalAchievementsByDate');
      expect(body).toHaveProperty('pomodoroByDate');
      expect(Array.isArray(body.completedTodosByDate)).toBe(true);
    });

    it('should validate date range parameters', async () => {
      const res = await app.request('/analytics/productivity?fromDate=invalid', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(400);
      const body = await res.json() as { code: string; message?: string; details?: unknown };
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should return empty arrays for no data', async () => {
      setupComplexDbMock({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockResolvedValue([]),
      });

      const res = await app.request('/analytics/productivity?fromDate=2025-01-20&toDate=2025-01-27', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as ProductivityResponse;
      
      expect(body.completedTodosByDate).toEqual([]);
      expect(body.goalAchievementsByDate).toEqual([]);
      expect(body.pomodoroByDate).toEqual([]);
    });
  });

  describe('GET /analytics/habits', () => {
    it('should return habit analytics with default 30 days', async () => {
      setupComplexDbMock({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        union: vi.fn().mockResolvedValue([
          { date: '2025-01-20', hasActivity: 1 },
          { date: '2025-01-21', hasActivity: 1 },
          { date: '2025-01-23', hasActivity: 1 },
        ]),
      });

      const res = await app.request('/analytics/habits', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as HabitsResponse;
      
      expect(body).toHaveProperty('currentStreak');
      expect(body).toHaveProperty('longestStreak');
      expect(body).toHaveProperty('mostProductiveHours');
      expect(body).toHaveProperty('mostProductiveDays');
      expect(body).toHaveProperty('activityDates');
      expect(Array.isArray(body.activityDates)).toBe(true);
    });

    it('should accept custom days parameter', async () => {
      setupComplexDbMock({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        union: vi.fn().mockResolvedValue([]),
      });

      const res = await app.request('/analytics/habits?days=7', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as HabitsResponse;
      expect(body.currentStreak).toBe(0);
      expect(body.longestStreak).toBe(0);
    });

    it('should calculate streaks correctly', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      setupComplexDbMock({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        union: vi.fn().mockResolvedValue([
          { date: today, hasActivity: 1 },
          { date: yesterday, hasActivity: 1 },
        ]),
      });

      const res = await app.request('/analytics/habits?days=7', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as HabitsResponse;
      expect(body.currentStreak).toBe(1);
      expect(body.longestStreak).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /analytics/goals-progress', () => {
    it('should return goals progress calculations', async () => {
      const startDate = new Date('2025-01-01').toISOString();
      const endDate = new Date('2025-12-31').toISOString();
      
      setupComplexDbMock({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: 1,
            title: 'Test Goal',
            startDate,
            endDate,
            achievementCount: 10,
          },
        ]),
      });

      const res = await app.request('/analytics/goals-progress', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as GoalProgress[];
      
      expect(Array.isArray(body)).toBe(true);
      expect(body[0]).toHaveProperty('id');
      expect(body[0]).toHaveProperty('totalDays');
      expect(body[0]).toHaveProperty('elapsedDays');
      expect(body[0]).toHaveProperty('progressPercentage');
      expect(body[0]).toHaveProperty('isOnTrack');
    });

    it('should handle goals with no achievements', async () => {
      setupComplexDbMock({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: 1,
            title: 'New Goal',
            startDate: new Date(Date.now() - 86400000).toISOString(), // Started yesterday
            endDate: new Date(Date.now() + 86400000 * 29).toISOString(), // 30 days total
            achievementCount: 0,
          },
        ]),
      });

      const res = await app.request('/analytics/goals-progress', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as GoalProgress[];
      
      expect(body[0].progressPercentage).toBe(0);
      // For a goal starting today, it may expect 1 achievement already
      expect(body[0].isOnTrack).toBe(false);
    });
  });

  describe('GET /analytics/tags', () => {
    it('should return tag analytics', async () => {
      const mockedDb = asMockedDb(ctx.db);
      let callCount = 0;
      mockedDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
        } else if (callCount === 2) {
          // First query in Promise.all - notes tags
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue([
              { tags: 'work,important' },
              { tags: 'personal,work' },
            ]),
          };
        } else {
          // Second query in Promise.all - moments tags
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue([
              { tags: 'urgent' },
            ]),
          };
        }
      });

      const res = await app.request('/analytics/tags', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as TagsResponse;
      
      expect(body).toHaveProperty('tags');
      expect(body).toHaveProperty('totalUniqueTags');
      expect(body).toHaveProperty('mostUsedTag');
      
      // Verify tag counting
      const workTag = body.tags.find((t) => t.tag === 'work');
      expect(workTag?.total).toBe(2);
    });

    it('should handle empty tags gracefully', async () => {
      setupComplexDbMock({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { tags: null },
          { tags: '' },
          { tags: '  ,  , ' },
        ]),
      });

      const res = await app.request('/analytics/tags', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as TagsResponse;
      
      expect(body.tags).toEqual([]);
      expect(body.totalUniqueTags).toBe(0);
      expect(body.mostUsedTag).toBe(null);
    });
  });

  describe('GET /analytics/time-distribution', () => {
    it('should return time distribution data', async () => {
      setupComplexDbMock({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockResolvedValue([
          { hour: 9, todos: 5 },
          { hour: 14, todos: 8 },
          { hour: 20, todos: 3 },
        ]),
      });

      const res = await app.request('/analytics/time-distribution', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as TimeDistributionResponse;
      
      expect(body).toHaveProperty('hourlyDistribution');
      expect(body).toHaveProperty('weekdayDistribution');
      
      // Should have all 24 hours
      expect(body.hourlyDistribution).toHaveLength(24);
      
      // Check specific hours
      expect(body.hourlyDistribution[9].todos).toBe(5);
      expect(body.hourlyDistribution[14].todos).toBe(8);
      expect(body.hourlyDistribution[0].todos).toBe(0); // Missing hour should be 0
    });

    it('should accept custom days parameter', async () => {
      setupComplexDbMock({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockResolvedValue([]),
      });

      const res = await app.request('/analytics/time-distribution?days=30', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as TimeDistributionResponse;
      
      // All hours should be 0 when no data
      expect(body.hourlyDistribution.every((h) => h.todos === 0)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const mockedDb = asMockedDb(ctx.db);
      let callCount = 0;
      mockedDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Auth middleware succeeds
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
        // Subsequent calls fail
        throw new Error('Connection failed');
      });

      const res = await app.request('/analytics/overview', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(500);
      const body = await res.json() as { code: string; message?: string };
      expect(body.code).toBe('INTERNAL_ERROR');
    });

    it('should handle query timeout errors', async () => {
      setupComplexDbMock({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockImplementation(() => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Query timeout')), 100);
          });
        }),
      });

      const res = await app.request('/analytics/overview', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(500);
    });
  });
});