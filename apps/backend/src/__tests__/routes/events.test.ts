import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import eventsRoutes from '../../routes/events';
import { generateTokens } from '../../utils/auth';
import { createMockDbChain } from '../helpers/test-context';
import type { Bindings, Variables } from '../../types';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import type { EventResponse } from '../helpers/response-types';

describe('Events Routes', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let mockDb: {
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    selectDistinct: ReturnType<typeof vi.fn>;
  };
  let env: Bindings;
  let validToken: string;
  let userId: string;

  beforeEach(async () => {
    userId = 'test-user-id';
    
    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      selectDistinct: vi.fn(),
    };

    env = {
      DB: {} as D1Database,
      JWT_SECRET: 'test-jwt-secret',
      OAUTH_GITHUB_CLIENT_ID: 'test-github-id',
      OAUTH_GITHUB_CLIENT_SECRET: 'test-github-secret',
      OAUTH_GOOGLE_CLIENT_ID: 'test-google-id',
      OAUTH_GOOGLE_CLIENT_SECRET: 'test-google-secret',
    ENVIRONMENT: 'test',
      RATE_LIMITER: {
        async get() { return null; },
        async put() { /* noop */ },
        async delete() { /* noop */ },
        async list() { return { keys: [], list_complete: true, cursor: null }; },
        async getWithMetadata() { return { value: null, metadata: null }; },
      } as unknown as KVNamespace,
    };

    const tokens = await generateTokens(userId, env.JWT_SECRET);
    validToken = tokens.accessToken;

    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    app.use('*', async (c, next) => {
      c.set('db', mockDb as any);
      await next();
    });
    
    app.route('/events', eventsRoutes);

    mockDb.select.mockImplementation(() => {
      return createMockDbChain({
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        enabled: true,
      });
    });
  });

  describe('GET /events/range', () => {
    it('should return events within date range', async () => {
      const mockEvents = [
        {
          id: 1,
          userId,
          title: 'Meeting',
          description: 'Team standup',
          startDateTime: '2024-01-15T10:00:00Z',
          endDateTime: '2024-01-15T11:00:00Z',
          allDay: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createMockDbChain({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            enabled: true,
          });
        } else {
          return createMockDbChain(mockEvents);
        }
      });

      const res = await app.request('/events/range?start=2024-01-01&end=2024-01-31', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as EventResponse[];
      expect(body).toHaveLength(1);
      expect(body[0].title).toBe('Meeting');
    });

    it('should return empty array when dates are missing', async () => {
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createMockDbChain({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            enabled: true,
          });
        } else {
          return createMockDbChain([]);
        }
      });

      const res = await app.request('/events/range', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, env);

      // The endpoint returns all events when no date range is specified
      expect(res.status).toBe(200);
      const body = await res.json() as EventResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });
  });

  describe('POST /events', () => {
    it('should create a new event', async () => {
      const newEvent = {
        id: 1,
        userId,
        title: 'New Event',
        description: 'Event description',
        startDateTime: '2024-01-20T14:00:00Z',
        endDateTime: '2024-01-20T15:00:00Z',
        allDay: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newEvent]),
        }),
      });

      const res = await app.request('/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Event',
          description: 'Event description',
          startDateTime: '2024-01-20T14:00:00Z',
          endDateTime: '2024-01-20T15:00:00Z',
          allDay: false,
        }),
      }, env);

      expect(res.status).toBe(201);
      const body = await res.json() as EventResponse;
      expect(body.title).toBe('New Event');
      expect(body.userId).toBe(userId);
    });
  });

  describe('PUT /events/:id', () => {
    it('should update an event', async () => {
      const existingEvent = {
        id: 1,
        userId,
        title: 'Existing Event',
        startTime: '2024-01-20T14:00:00Z',
        endTime: '2024-01-20T15:00:00Z',
      };

      let selectCallCount = 0;
      mockDb.select.mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return createMockDbChain({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            enabled: true,
          });
        } else {
          return createMockDbChain(existingEvent);
        }
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...existingEvent,
              title: 'Updated Event',
            }]),
          }),
        }),
      });

      const res = await app.request('/events/1', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated Event',
        }),
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as EventResponse;
      expect(body.title).toBe('Updated Event');
    });
  });

  describe('DELETE /events/:id', () => {
    it('should delete an event', async () => {
      let selectCallCount = 0;
      mockDb.select.mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return createMockDbChain({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            enabled: true,
          });
        } else {
          return createMockDbChain({
            id: 1,
            userId,
            title: 'Event to delete',
          });
        }
      });

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnThis(),
      });

      const res = await app.request('/events/1', {
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