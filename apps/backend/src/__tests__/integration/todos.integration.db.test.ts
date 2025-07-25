import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { Hono } from 'hono';
import todosRoutes from '../../routes/todos';
import { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } from './setup-test-db';
import { createTestUserData, createTestTodoData } from './fixtures';
import { generateToken } from '../../utils/auth';
import type { Bindings, Variables } from '../../types';

describe('Todos Routes Integration with Real Database', () => {
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
    accessToken = await generateToken({
      type: 'access',
      userId: testUser.id,
      username: testUser.username,
    }, env.JWT_SECRET);

    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Add database middleware
    app.use('*', async (c, next) => {
      c.set('db', db);
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
      const body = await res.json();
      
      expect(body).toHaveProperty('items');
      expect(body.items).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('should return user todos with pagination', async () => {
      // Create test todos
      const todo1 = await db.insert(schema.todos)
        .values(createTestTodoData(testUser.id, { title: 'Todo 1' }))
        .returning();
      const todo2 = await db.insert(schema.todos)
        .values(createTestTodoData(testUser.id, { title: 'Todo 2' }))
        .returning();

      const res = await app.request('/todos?page=1&size=10', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json();
      
      expect(body.items).toHaveLength(2);
      expect(body.total).toBe(2);
      expect(body.items[0].title).toBe('Todo 1');
      expect(body.items[1].title).toBe('Todo 2');
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
      const body = await res.json();
      
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
      const body = await res.json();
      
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
      const [todo] = await db.insert(schema.todos)
        .values(createTestTodoData(testUser.id, { title: 'Original Title' }))
        .returning();

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
      const body = await res.json();
      
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
      const [otherUser] = await db.insert(schema.users).values(otherUserData).returning();
      const [otherTodo] = await db.insert(schema.todos)
        .values(createTestTodoData(otherUser.id, { title: 'Other User Todo' }))
        .returning();

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
      const [unchangedTodo] = await db.select().from(schema.todos).where(eq(schema.todos.id, otherTodo.id));
      expect(unchangedTodo.title).toBe('Other User Todo');
    });
  });

  describe('DELETE /todos/:id', () => {
    it('should delete own todo', async () => {
      // Create a todo
      const [todo] = await db.insert(schema.todos)
        .values(createTestTodoData(testUser.id))
        .returning();

      const res = await app.request(`/todos/${todo.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, env);

      expect(res.status).toBe(204);
      
      // Verify deleted from database
      const todos = await db.select().from(schema.todos).where(eq(schema.todos.id, todo.id));
      expect(todos).toHaveLength(0);
    });
  });
});

// Import schema and utilities after setup to avoid circular dependencies
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';