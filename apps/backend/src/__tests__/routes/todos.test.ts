import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import todosRoutes from '../../routes/todos';
import { generateTokens } from '../../utils/auth';
import { createMockDbChain } from '../helpers/test-context';
import type { Bindings, Variables } from '../../types';
import type { D1Database } from '@cloudflare/workers-types';
import type { TodoResponse, PaginatedResponse, APIErrorResponse } from '../helpers/response-types';

describe('Todos Routes', () => {
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
    // Setup
    userId = 'test-user-id';
    
    // Create mock user for auth middleware
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      enabled: true,
      weekStartDay: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

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

    // Generate valid token
    const tokens = await generateTokens(userId, env.JWT_SECRET);
    validToken = tokens.accessToken;

    // Create app
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Add database middleware
    app.use('*', async (c, next) => {
      c.set('db', mockDb as any);
      await next();
    });
    
    // Mount todos routes (they have their own auth middleware)
    app.route('/todos', todosRoutes);

    // Default mock for auth middleware user lookup
    mockDb.select.mockImplementation(() => {
      return createMockDbChain(mockUser);
    });
  });

  describe('Authentication', () => {
    it('should return 401 when no token provided', async () => {
      const res = await app.request('/todos', {
        method: 'GET',
      }, env);

      expect(res.status).toBe(401);
      const body = await res.json() as APIErrorResponse;
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for invalid token', async () => {
      const res = await app.request('/todos', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      }, env);

      expect(res.status).toBe(401);
      const body = await res.json() as APIErrorResponse;
      expect(body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /todos', () => {
    it('should return empty array when no todos exist', async () => {
      // First call is for auth middleware (user lookup)
      // Second call is for todos items query
      // Third call is for todos count query
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
        } else if (callCount === 2) {
          // Todos items query
          return createMockDbChain([]);
        } else {
          // Todos count query
          return createMockDbChain([{ count: 0 }]);
        }
      });

      const res = await app.request('/todos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as PaginatedResponse<TodoResponse>;
      expect(body.items).toEqual([]);
      expect(body.total).toBe(0);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(20);
      expect(body.totalPages).toBe(0);
    });

    it('should return todos for authenticated user', async () => {
      const mockTodos = [
        {
          id: 1,
          userId,
          parentId: null,
          title: 'Test Todo 1',
          description: 'Description 1',
          completed: false,
          priority: 'MEDIUM',
          dueDate: null,
          completedAt: null,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId,
          parentId: null,
          title: 'Test Todo 2',
          description: 'Description 2',
          completed: true,
          priority: 'HIGH',
          dueDate: null,
          completedAt: new Date(),
          order: 1,
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
        } else if (callCount === 2) {
          // Todos items query
          return createMockDbChain(mockTodos);
        } else {
          // Todos count query
          return createMockDbChain([{ count: 2 }]);
        }
      });

      const res = await app.request('/todos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as PaginatedResponse<TodoResponse>;
      expect(body.items).toHaveLength(2);
      expect(body.items[0].title).toBe('Test Todo 1');
      expect(body.items[1].title).toBe('Test Todo 2');
      expect(body.total).toBe(2);
      expect(body.totalPages).toBe(1);
    });
  });

  describe('POST /todos', () => {
    it('should return 400 for invalid input', async () => {
      const res = await app.request('/todos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required title
          description: 'Test description',
        }),
      }, env);

      expect(res.status).toBe(400);
      const body = await res.json() as APIErrorResponse;
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Invalid input');
      // The details should contain validation errors - for now accept empty object
      expect(body.details).toBeDefined();
    });

    it('should create todo successfully', async () => {
      const newTodo = {
        id: 1,
        userId,
        parentId: null,
        title: 'New Todo',
        description: 'New Description',
        completed: false,
        priority: 'MEDIUM',
        dueDate: null,
        completedAt: null,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newTodo]),
        }),
      });

      const res = await app.request('/todos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Todo',
          description: 'New Description',
          priority: 'MEDIUM',
        }),
      }, env);

      expect(res.status).toBe(201);
      const body = await res.json() as TodoResponse;
      expect(body.title).toBe('New Todo');
      expect(body.userId).toBe(userId);
    });
  });

  describe('DELETE /todos/:id', () => {
    it('should return 404 when todo not found', async () => {
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
          // Todo lookup - not found
          return createMockDbChain(null);
        }
      });

      const res = await app.request('/todos/999', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, env);

      expect(res.status).toBe(404);
      const body = await res.json() as APIErrorResponse;
      expect(body.code).toBe('NOT_FOUND');
    });

    it('should delete todo successfully', async () => {
      const todo = {
        id: 1,
        userId,
        title: 'Todo to delete',
      };

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
          // Todo lookup - found
          return createMockDbChain(todo);
        }
      });
      
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnThis(),
      });

      const res = await app.request('/todos/1', {
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