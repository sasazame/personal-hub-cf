import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { Hono } from 'hono';
import analyticsRoutes from '../../routes/analytics';
import { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } from './setup-test-db';
import { createTestUserData, createTestTodoData, createTestGoalData, createTestNoteData } from './fixtures';
import * as jwt from '@tsndr/cloudflare-worker-jwt';
import type { Bindings, Variables } from '../../types';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';

describe('Analytics Routes Integration with Real Database', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let db: any;
  let env: Bindings;
  let testUser: any;
  let accessToken: string;

  beforeEach(async () => {
    // Setup test database
    const setup = await setupTestDatabase();
    db = setup.db;
    env = setup.env as Bindings;

    // Create test user
    const userData = await createTestUserData();
    testUser = await db.insert(schema.users).values(userData).returning();
    testUser = testUser[0];
    
    // Generate access token
    accessToken = await jwt.sign(
      { 
        sub: testUser.id, 
        type: 'access',
        exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
      },
      env.JWT_SECRET
    );

    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Add database middleware
    app.use('*', async (c, next) => {
      c.set('db', db);
      await next();
    });
    
    // Mount analytics routes
    app.route('/analytics', analyticsRoutes);
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });
  
  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('GET /analytics/overview', () => {
    it('should return complete analytics overview with real data', async () => {
      // Create test data
      await db.insert(schema.todos).values([
        createTestTodoData(testUser.id, { status: 'DONE' }),
        createTestTodoData(testUser.id, { status: 'IN_PROGRESS' }),
        createTestTodoData(testUser.id, { status: 'TODO' }),
      ]);

      await db.insert(schema.goals).values(
        createTestGoalData(testUser.id, { isActive: true })
      );

      await db.insert(schema.notes).values(
        createTestNoteData(testUser.id)
      );

      await db.insert(schema.moments).values({
        userId: testUser.id,
        content: 'Test moment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await app.request('/analytics/overview', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.todos.total).toBe(3);
      expect(body.todos.completed).toBe(1);
      expect(body.todos.inProgress).toBe(1);
      expect(body.todos.todo).toBe(1);
      expect(body.todos.completionRate).toBeCloseTo(0.333, 2);
      
      expect(body.goals.total).toBe(1);
      expect(body.goals.active).toBe(1);
      
      expect(body.notes.total).toBe(1);
      expect(body.moments.total).toBe(1);
      expect(body.moments.today).toBe(1);
    });

    it('should return zeros for user with no data', async () => {
      const res = await app.request('/analytics/overview', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.todos.total).toBe(0);
      expect(body.todos.completionRate).toBe(0);
      expect(body.goals.total).toBe(0);
      expect(body.pomodoro.totalSessions).toBe(0);
      expect(body.events.total).toBe(0);
      expect(body.notes.total).toBe(0);
      expect(body.moments.total).toBe(0);
    });
  });

  describe('GET /analytics/productivity', () => {
    it('should return productivity data for date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      // Create completed todos on different dates
      await db.insert(schema.todos).values([
        {
          ...createTestTodoData(testUser.id, { status: 'DONE' }),
          updatedAt: today + 'T10:00:00.000Z',
        },
        {
          ...createTestTodoData(testUser.id, { status: 'DONE' }),
          updatedAt: today + 'T14:00:00.000Z',
        },
        {
          ...createTestTodoData(testUser.id, { status: 'DONE' }),
          updatedAt: yesterday + 'T10:00:00.000Z',
        },
      ]);

      const res = await app.request(`/analytics/productivity?fromDate=${yesterday}&toDate=${today}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.completedTodosByDate).toHaveLength(2);
      
      const todayData = body.completedTodosByDate.find((d: any) => d.date === today);
      const yesterdayData = body.completedTodosByDate.find((d: any) => d.date === yesterday);
      
      expect(todayData?.count).toBe(2);
      expect(yesterdayData?.count).toBe(1);
    });

    it('should validate date parameters', async () => {
      const res = await app.request('/analytics/productivity?fromDate=invalid-date&toDate=2025-01-27', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /analytics/habits', () => {
    it('should calculate activity streaks correctly', async () => {
      const dates = [];
      for (let i = 0; i < 5; i++) {
        const date = new Date(Date.now() - (i * 86400000));
        dates.push(date.toISOString());
      }

      // Create activity for consecutive days
      for (const date of dates.slice(0, 3)) {
        await db.insert(schema.todos).values({
          ...createTestTodoData(testUser.id),
          createdAt: date,
        });
      }

      const res = await app.request('/analytics/habits?days=7', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.currentStreak).toBe(3);
      expect(body.longestStreak).toBe(3);
      expect(body.activityDates).toHaveLength(3);
    });

    it('should identify productive hours', async () => {
      // Create todos at specific hours
      await db.insert(schema.todos).values([
        {
          ...createTestTodoData(testUser.id, { status: 'DONE' }),
          createdAt: new Date().toISOString().replace(/T\d{2}/, 'T09'),
        },
        {
          ...createTestTodoData(testUser.id, { status: 'DONE' }),
          createdAt: new Date().toISOString().replace(/T\d{2}/, 'T09'),
        },
        {
          ...createTestTodoData(testUser.id, { status: 'DONE' }),
          createdAt: new Date().toISOString().replace(/T\d{2}/, 'T14'),
        },
      ]);

      const res = await app.request('/analytics/habits', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.mostProductiveHours).toBeDefined();
      expect(body.mostProductiveHours[0].hour).toBe(9);
      expect(body.mostProductiveHours[0].count).toBe(2);
    });
  });

  describe('GET /analytics/tags', () => {
    it('should count tags from notes and moments', async () => {
      await db.insert(schema.notes).values([
        createTestNoteData(testUser.id, { tags: 'work,important' }),
        createTestNoteData(testUser.id, { tags: 'work,personal' }),
        createTestNoteData(testUser.id, { tags: 'urgent' }),
      ]);

      await db.insert(schema.moments).values([
        {
          userId: testUser.id,
          content: 'Test moment 1',
          tags: 'work,reflection',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          userId: testUser.id,
          content: 'Test moment 2',
          tags: 'personal,health',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      const res = await app.request('/analytics/tags', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.totalUniqueTags).toBe(6); // work, important, personal, urgent, reflection, health
      expect(body.mostUsedTag.tag).toBe('work');
      expect(body.mostUsedTag.total).toBe(3);
      expect(body.mostUsedTag.notes).toBe(2);
      expect(body.mostUsedTag.moments).toBe(1);
      
      const personalTag = body.tags.find((t: any) => t.tag === 'personal');
      expect(personalTag.total).toBe(2);
      expect(personalTag.notes).toBe(1);
      expect(personalTag.moments).toBe(1);
    });

    it('should handle missing tags', async () => {
      await db.insert(schema.notes).values([
        createTestNoteData(testUser.id, { tags: null }),
        createTestNoteData(testUser.id, { tags: '' }),
      ]);

      const res = await app.request('/analytics/tags', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.totalUniqueTags).toBe(0);
      expect(body.mostUsedTag).toBe(null);
      expect(body.tags).toEqual([]);
    });
  });

  describe('GET /analytics/goals-progress', () => {
    it('should calculate goal progress correctly', async () => {
      const startDate = new Date('2025-01-01').toISOString();
      const endDate = new Date('2025-12-31').toISOString();
      
      const goal = await db.insert(schema.goals)
        .values(createTestGoalData(testUser.id, {
          startDate,
          endDate,
          isActive: true,
        }))
        .returning();

      // Add some achievements
      for (let i = 0; i < 5; i++) {
        await db.insert(schema.goalAchievementHistory).values({
          goalId: goal[0].id,
          achievedDate: new Date(2025, 0, i + 10).toISOString().split('T')[0],
          notes: 'Achievement ' + i,
        });
      }

      const res = await app.request('/analytics/goals-progress', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe(goal[0].id);
      expect(body[0].achievementCount).toBe(5);
      expect(body[0].totalDays).toBe(365);
      expect(body[0]).toHaveProperty('progressPercentage');
      expect(body[0]).toHaveProperty('isOnTrack');
    });
  });

  describe('GET /analytics/time-distribution', () => {
    it('should return hourly distribution', async () => {
      // Create todos at different hours
      const hours = [9, 9, 14, 14, 14, 20];
      for (const hour of hours) {
        const date = new Date();
        date.setHours(hour, 0, 0, 0);
        await db.insert(schema.todos).values({
          ...createTestTodoData(testUser.id),
          createdAt: date.toISOString(),
        });
      }

      const res = await app.request('/analytics/time-distribution?days=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.hourlyDistribution).toHaveLength(24);
      expect(body.hourlyDistribution[9].todos).toBe(2);
      expect(body.hourlyDistribution[14].todos).toBe(3);
      expect(body.hourlyDistribution[20].todos).toBe(1);
      expect(body.hourlyDistribution[0].todos).toBe(0);
    });
  });
});