import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { Hono } from 'hono';
import todosRoutes from '../../routes/todos';
import { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } from './setup-test-db';
import { createTestUserData, createTestTodoData } from './fixtures';
import * as jwt from '@tsndr/cloudflare-worker-jwt';
import type { Bindings, Variables } from '../../types';
import type { Database } from '../../db';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';
import { InferSelectModel } from 'drizzle-orm';

describe('Todos Routes Integration with Real Database', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let db: Database;
  let env: Bindings;
  let testUser: InferSelectModel<typeof schema.users>;
  let accessToken: string;

  beforeEach(async () => {
    // Setup test database
    const setup = await setupTestDatabase();
    db = setup.db as any;
    env = setup.env as Bindings;

    // Create test user
    const userData = await createTestUserData();
    const users = await db.insert(schema.users).values(userData).returning();
    testUser = users[0];
    
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
      c.set('db', db as any);
      await next();
    });
    
    // Mount todos routes
    app.route('/todos', todosRoutes);
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });
  
  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('GET /todos', () => {
    it('should return empty list when no todos exist', async () => {
      const res = await app.request('/todos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as { items: InferSelectModel<typeof schema.todos>[], total: number };
      
      expect(body).toHaveProperty('items');
      expect(body.items).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('should return user todos with pagination', async () => {
      // Create test todos
      await db.insert(schema.todos)
        .values(createTestTodoData(testUser.id, { title: 'Todo 1' }))
        .returning();
      await db.insert(schema.todos)
        .values(createTestTodoData(testUser.id, { title: 'Todo 2' }))
        .returning();

      const res = await app.request('/todos?page=1&limit=10', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as { items: InferSelectModel<typeof schema.todos>[], total: number };
      
      expect(body.items).toHaveLength(2);
      expect(body.total).toBe(2);
      
      // Items might be returned in any order, so check both exist
      const titles = body.items.map((item) => item.title);
      expect(titles).toContain('Todo 1');
      expect(titles).toContain('Todo 2');
    });

    it('should not return other users todos', async () => {
      // Create another user
      const otherUserData = await createTestUserData();
      const otherUser = await db.insert(schema.users).values(otherUserData).returning();
      
      // Create todo for other user
      await db.insert(schema.todos)
        .values(createTestTodoData(otherUser[0].id, { title: 'Other User Todo' }))
        .returning();

      const res = await app.request('/todos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as { items: InferSelectModel<typeof schema.todos>[], total: number };
      
      expect(body.items).toHaveLength(0);
      expect(body.total).toBe(0);
    });
  });

  describe('POST /todos', () => {
    it('should create a new todo', async () => {
      const todoData = {
        title: 'New Todo',
        description: 'New Todo Description',
        priority: 'HIGH',
        dueDate: '2025-12-31',
      };

      const res = await app.request('/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(todoData),
      }, env);

      expect(res.status).toBe(201);
      const body = await res.json() as InferSelectModel<typeof schema.todos>;
      
      expect(body.title).toBe(todoData.title);
      expect(body.description).toBe(todoData.description);
      expect(body.priority).toBe(todoData.priority);
      expect(body.dueDate).toBe(todoData.dueDate);
      expect(body.userId).toBe(testUser.id);
      
      // Verify in database
      const todos = await db.select().from(schema.todos).where(eq(schema.todos.userId, testUser.id));
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe(todoData.title);
    });
  });

  describe('PUT /todos/:id', () => {
    it('should update own todo', async () => {
      // Create a todo
      const todos = await db.insert(schema.todos)
        .values(createTestTodoData(testUser.id, { title: 'Original Title' }))
        .returning() as InferSelectModel<typeof schema.todos>[];
      const todo = todos[0];

      const updateData = {
        title: 'Updated Title',
        status: 'IN_PROGRESS',
      };

      const res = await app.request(`/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updateData),
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as InferSelectModel<typeof schema.todos>;
      
      expect(body.title).toBe(updateData.title);
      expect(body.status).toBe(updateData.status);
      
      // Verify in database
      const [updatedTodo] = await db.select().from(schema.todos).where(eq(schema.todos.id, todo.id));
      expect(updatedTodo.title).toBe(updateData.title);
      expect(updatedTodo.status).toBe(updateData.status);
    });

    it('should not update other users todo', async () => {
      // Create another user and their todo
      const otherUserData = await createTestUserData();
      const otherUsers = await db.insert(schema.users).values(otherUserData).returning();
      const otherUser = otherUsers[0];
      const otherTodos = await db.insert(schema.todos)
        .values(createTestTodoData(otherUser.id, { title: 'Other User Todo' }))
        .returning() as InferSelectModel<typeof schema.todos>[];
      const otherTodo = otherTodos[0];

      const res = await app.request(`/todos/${otherTodo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: 'Hacked Title' }),
      }, env);

      expect(res.status).toBe(404);
      
      // Verify todo wasn't changed
      const unchangedTodos = await db.select().from(schema.todos).where(eq(schema.todos.id, otherTodo.id));
      const unchangedTodo = unchangedTodos[0];
      expect(unchangedTodo.title).toBe('Other User Todo');
    });
  });

  describe('DELETE /todos/:id', () => {
    it('should delete own todo', async () => {
      // Create a todo
      const deleteTodos = await db.insert(schema.todos)
        .values(createTestTodoData(testUser.id))
        .returning() as InferSelectModel<typeof schema.todos>[];
      const todo = deleteTodos[0];

      const res = await app.request(`/todos/${todo.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(204);
      
      // Verify deleted from database
      const remainingTodos = await db.select().from(schema.todos).where(eq(schema.todos.id, todo.id));
      expect(remainingTodos).toHaveLength(0);
    });
  });
});