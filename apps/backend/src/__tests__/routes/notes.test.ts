import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import notesRoutes from '../../routes/notes';
import { generateTokens } from '../../utils/auth';
import { createMockDbChain } from '../helpers/test-context';
import type { Bindings, Variables } from '../../types';
import type { D1Database } from '@cloudflare/workers-types';
import type { NoteResponse, PaginatedResponse, APIErrorResponse } from '../helpers/response-types';

describe('Notes Routes', () => {
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
    };

    const tokens = await generateTokens(userId, env.JWT_SECRET);
    validToken = tokens.accessToken;

    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    app.use('*', async (c, next) => {
      c.set('db', mockDb as any);
      await next();
    });
    
    app.route('/notes', notesRoutes);

    mockDb.select.mockImplementation(() => {
      return createMockDbChain({
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        enabled: true,
      });
    });
  });

  describe('GET /notes', () => {
    it('should return paginated notes', async () => {
      const mockNotes = [
        {
          id: 1,
          userId,
          title: 'Test Note',
          content: 'Note content',
          tags: 'test,note',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Auth middleware
          return createMockDbChain({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            enabled: true,
          });
        } else if (callCount === 2) {
          // Notes query
          return createMockDbChain(mockNotes);
        } else {
          // Count query
          return createMockDbChain([{ count: 1 }]);
        }
      });

      const res = await app.request('/notes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as PaginatedResponse<NoteResponse>;
      expect(body.items).toHaveLength(1);
      expect(body.items[0].title).toBe('Test Note');
      expect(body.total).toBe(1);
    });

    it('should filter by search query', async () => {
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Auth middleware
          return createMockDbChain({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            enabled: true,
          });
        } else {
          // Notes/count query
          return createMockDbChain([]);
        }
      });

      const res = await app.request('/notes?q=javascript', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /notes/tags', () => {
    it('should return all unique tags', async () => {
      const mockNotes = [
        { tags: 'work,project' },
        { tags: 'personal,work' },
        { tags: 'hobby' },
      ];

      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Auth middleware
          return createMockDbChain({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            enabled: true,
          });
        } else {
          // Tags query
          return createMockDbChain(mockNotes);
        }
      });

      const res = await app.request('/notes/tags', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as Array<{ tag: string; count: number }>;
      
      // Extract tags from the response format
      const tags = body.map((item) => item.tag);
      expect(tags).toHaveLength(4);
      expect(tags).toContain('work');
      expect(tags).toContain('personal');
      expect(tags).toContain('project');
      expect(tags).toContain('hobby');
    });
  });

  describe('POST /notes', () => {
    it('should create a new note', async () => {
      const newNote = {
        id: 1,
        userId,
        title: 'New Note',
        content: 'Note content',
        tags: 'new,test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newNote]),
        }),
      });

      const res = await app.request('/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Note',
          content: 'Note content',
          tags: 'new,test',
        }),
      }, env);

      expect(res.status).toBe(201);
      const body = await res.json() as NoteResponse;
      expect(body.title).toBe('New Note');
      expect(body.userId).toBe(userId);
    });

    it('should return 400 for invalid input', async () => {
      const res = await app.request('/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required title
          content: 'Note content',
        }),
      }, env);

      expect(res.status).toBe(400);
      const body = await res.json() as APIErrorResponse;
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /notes/:id', () => {
    it('should update a note', async () => {
      const existingNote = {
        id: 1,
        userId,
        title: 'Existing Note',
        content: 'Old content',
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
          // Note lookup
          return createMockDbChain(existingNote);
        }
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...existingNote,
              content: 'Updated content',
            }]),
          }),
        }),
      });

      const res = await app.request('/notes/1', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Updated content',
        }),
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as NoteResponse;
      expect(body.content).toBe('Updated content');
    });
  });

  describe('DELETE /notes/:id', () => {
    it('should delete a note', async () => {
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
          // Note lookup
          return createMockDbChain({
            id: 1,
            userId,
            title: 'Note to delete',
          });
        }
      });

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnThis(),
      });

      const res = await app.request('/notes/1', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, env);

      expect(res.status).toBe(204);
      expect(res.body).toBeNull();
    });

    it('should return 404 for non-existent note', async () => {
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
          // Note lookup - not found
          return createMockDbChain(null);
        }
      });

      const res = await app.request('/notes/999', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, env);

      expect(res.status).toBe(404);
      const body = await res.json() as APIErrorResponse;
      expect(body.code).toBe('NOT_FOUND');
    });
  });
});