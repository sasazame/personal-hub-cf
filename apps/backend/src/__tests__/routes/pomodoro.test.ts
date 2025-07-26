import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import pomodoroRoutes from '../../routes/pomodoro';
import type { Bindings, Variables } from '../../types';
import { createTestContext, createMockDbChain } from '../helpers/test-context';
import * as jwt from '@tsndr/cloudflare-worker-jwt';

vi.mock('../../utils/nanoid', () => ({
  nanoid: () => 'test-id-123',
}));

describe('Pomodoro Routes', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let ctx: any;
  let validToken: string;
  const userId = 'test-user';

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
    
    app.route('/pomodoro', pomodoroRoutes);
    
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
      const res = await app.request('/pomodoro/sessions', {
        method: 'GET',
      }, ctx.env);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for invalid token', async () => {
      const res = await app.request('/pomodoro/sessions', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      }, ctx.env);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /pomodoro/sessions', () => {
    it('should return paginated sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          userId: 'test-user',
          startTime: '2025-01-26T10:00:00Z',
          status: 'COMPLETED',
          completedCycles: 4,
          workDuration: 25,
          breakDuration: 5,
        },
        {
          id: 'session-2',
          userId: 'test-user',
          startTime: '2025-01-25T10:00:00Z',
          status: 'COMPLETED',
          completedCycles: 2,
          workDuration: 25,
          breakDuration: 5,
        },
      ];

      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockSessions),
      }));

      const res = await app.request('/pomodoro/sessions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(Array.isArray(body)).toBe(true);
      expect(body).toEqual(mockSessions);
    });

    it('should handle pagination parameters', async () => {
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn((limit) => {
          expect(limit).toBe(10);
          return {
            offset: vi.fn((offset) => {
              expect(offset).toBe(10);
              return Promise.resolve([]);
            }),
          };
        }),
      }));

      const res = await app.request('/pomodoro/sessions?limit=10&offset=10', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /pomodoro/sessions/active', () => {
    it('should return active session with tasks', async () => {
      const mockSession = {
        id: 'active-session',
        userId: 'test-user',
        status: 'ACTIVE',
        completedCycles: 1,
      };

      const mockTasks = [
        { id: 'task-1', sessionId: 'active-session', description: 'Task 1', completed: false },
        { id: 'task-2', sessionId: 'active-session', description: 'Task 2', completed: true },
      ];

      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(mockSession),
        orderBy: vi.fn().mockResolvedValue(mockTasks),
      }));

      const res = await app.request('/pomodoro/sessions/active', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.id).toBe(mockSession.id);
      expect(body.tasks).toEqual(mockTasks);
    });

    it('should return 404 when no active session', async () => {
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(null),
      }));

      const res = await app.request('/pomodoro/sessions/active', {
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

  describe('GET /pomodoro/sessions/:id', () => {
    it('should return specific session with tasks', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'test-user',
        status: 'COMPLETED',
      };

      const mockTasks = [
        { id: 'task-1', sessionId: 'session-123', description: 'Task 1' },
      ];

      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(mockSession),
        orderBy: vi.fn().mockResolvedValue(mockTasks),
      }));

      const res = await app.request('/pomodoro/sessions/session-123', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.id).toBe('session-123');
      expect(body.tasks).toEqual(mockTasks);
    });

    it('should return 404 for non-existent session', async () => {
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(null),
      }));

      const res = await app.request('/pomodoro/sessions/non-existent', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /pomodoro/sessions', () => {
    it('should create a new session', async () => {
      const sessionData = {
        workDuration: 25,
        breakDuration: 5,
        sessionType: 'WORK',
        tasks: [
          { description: 'Complete feature', orderIndex: 0 },
          { todoId: 123, description: 'Review PR', orderIndex: 1 },
        ],
      };

      // No active session
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(null),
        orderBy: vi.fn().mockResolvedValue(sessionData.tasks),
      }));

      ctx.db.insert.mockImplementation(() => ({
        values: vi.fn().mockResolvedValue(undefined),
      }));

      const res = await app.request('/pomodoro/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify(sessionData),
      }, ctx.env);

      expect(res.status).toBe(201);
      const body = await res.json();
      
      expect(body.id).toBe('test-id-123');
      expect(body.workDuration).toBe(25);
      expect(body.breakDuration).toBe(5);
      expect(body.status).toBe('ACTIVE');
      expect(body.tasks).toEqual(sessionData.tasks);
    });

    it('should return 409 if active session exists', async () => {
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ id: 'existing-session' }),
      }));

      const res = await app.request('/pomodoro/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          workDuration: 25,
          breakDuration: 5,
        }),
      }, ctx.env);

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.code).toBe('CONFLICT');
    });

    it('should validate required fields', async () => {
      const res = await app.request('/pomodoro/sessions', {
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
  });

  describe('PUT /pomodoro/sessions/:id', () => {
    it('should update session status', async () => {
      const existingSession = {
        id: 'session-123',
        status: 'ACTIVE',
        completedCycles: 2,
      };

      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(existingSession),
      }));

      ctx.db.update.mockImplementation(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          ...existingSession,
          status: 'COMPLETED',
          completedCycles: 4,
        }]),
      }));

      const res = await app.request('/pomodoro/sessions/session-123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          status: 'COMPLETED',
          completedCycles: 4,
        }),
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.status).toBe('COMPLETED');
      expect(body.completedCycles).toBe(4);
    });

    it('should return 404 for non-existent session', async () => {
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(null),
      }));

      const res = await app.request('/pomodoro/sessions/non-existent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      }, ctx.env);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /pomodoro/sessions/:sessionId/tasks/:taskId', () => {
    it('should update task completion status', async () => {
      // Mock session exists
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ id: 'session-123' }),
      }));

      ctx.db.update.mockImplementation(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'task-123',
          completed: true,
        }]),
      }));

      const res = await app.request('/pomodoro/sessions/session-123/tasks/task-123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({ completed: true }),
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.completed).toBe(true);
    });

    it('should return 404 if session not found', async () => {
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(null),
      }));

      const res = await app.request('/pomodoro/sessions/non-existent/tasks/task-123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({ completed: true }),
      }, ctx.env);

      expect(res.status).toBe(404);
    });

    it('should return 404 if task not found', async () => {
      // Session exists
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ id: 'session-123' }),
      }));

      // But task update returns empty
      ctx.db.update.mockImplementation(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      }));

      const res = await app.request('/pomodoro/sessions/session-123/tasks/non-existent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({ completed: true }),
      }, ctx.env);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /pomodoro/config', () => {
    it('should return user config', async () => {
      const mockConfig = {
        workDuration: 30,
        shortBreakDuration: 10,
        longBreakDuration: 20,
        cyclesBeforeLongBreak: 3,
        alarmSound: 'bell',
        alarmVolume: 75,
        autoStartBreaks: false,
        autoStartWork: true,
      };

      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(mockConfig),
      }));

      const res = await app.request('/pomodoro/config', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(mockConfig);
    });

    it('should return default config if user has none', async () => {
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(null),
      }));

      const res = await app.request('/pomodoro/config', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      // Check default values
      expect(body.workDuration).toBe(25);
      expect(body.shortBreakDuration).toBe(5);
      expect(body.longBreakDuration).toBe(15);
      expect(body.cyclesBeforeLongBreak).toBe(4);
      expect(body.alarmSound).toBe('default');
      expect(body.alarmVolume).toBe(50);
      expect(body.autoStartBreaks).toBe(true);
      expect(body.autoStartWork).toBe(false);
    });
  });

  describe('PUT /pomodoro/config', () => {
    it('should update existing config', async () => {
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ id: 'existing-config' }),
      }));

      const updateData = {
        workDuration: 30,
        shortBreakDuration: 10,
      };

      ctx.db.update.mockImplementation(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updateData]),
      }));

      const res = await app.request('/pomodoro/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify(updateData),
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.workDuration).toBe(30);
    });

    it('should create new config if none exists', async () => {
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(null),
      }));

      const configData = {
        workDuration: 20,
      };

      ctx.db.insert.mockImplementation(() => ({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'test-id-123',
          ...configData,
          shortBreakDuration: 5, // Default values
          longBreakDuration: 15,
        }]),
      }));

      const res = await app.request('/pomodoro/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify(configData),
      }, ctx.env);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.workDuration).toBe(20);
      expect(body.shortBreakDuration).toBe(5); // Default
    });

    it('should validate config values', async () => {
      const res = await app.request('/pomodoro/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          workDuration: 0, // Invalid
          alarmVolume: 150, // Invalid
        }),
      }, ctx.env);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /pomodoro/stats', () => {
    it('should return pomodoro statistics', async () => {
      const mockSessions = [
        { completedCycles: 4, workDuration: 25 },
        { completedCycles: 2, workDuration: 25 },
        { completedCycles: 3, workDuration: 30 },
      ];

      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockSessions),
      }));

      const res = await app.request('/pomodoro/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.totalSessions).toBe(3);
      expect(body.totalCycles).toBe(9);
      expect(body.totalWorkMinutes).toBe(240); // (4*25) + (2*25) + (3*30)
      expect(body.averageCyclesPerSession).toBe(3);
    });

    it('should handle no completed sessions', async () => {
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      }));

      const res = await app.request('/pomodoro/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.totalSessions).toBe(0);
      expect(body.totalCycles).toBe(0);
      expect(body.totalWorkMinutes).toBe(0);
      expect(body.averageCyclesPerSession).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      ctx.db.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const res = await app.request('/pomodoro/sessions', {
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