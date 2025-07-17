import { Hono } from 'hono';
import { eq, and, desc, asc, count, isNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { todos, type NewTodo } from '@personal-hub/shared';
import {
  createTodoSchema,
  updateTodoSchema,
  todoQuerySchema,
  TodoStatus,
  TodoPriority,
  type TodoStatusType,
  type PaginatedTodos,
} from '@personal-hub/shared';
import { initializeLucia } from '../lib/auth';
import { serializeTodo, serializeTodos } from '../helpers/todo-serializer';
import type { Context } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

type Env = {
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: { id: string };
    session: { id: string };
  };
};

const todoRouter = new Hono<Env>();

// Middleware to ensure user is authenticated
async function requireAuth(c: Context<Env>, next: () => Promise<void>) {
  const lucia = initializeLucia(c.env.DB);
  const sessionId = lucia.readSessionCookie(c.req.header('Cookie') ?? '');
  
  if (!sessionId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { session, user } = await lucia.validateSession(sessionId);
  
  if (!session || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', user);
  c.set('session', session);
  
  await next();
}

// Apply auth middleware to all routes
todoRouter.use('*', requireAuth);

// Create a new todo
todoRouter.post('/', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  
  // Validate input
  const parseResult = createTodoSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: 'Invalid input', details: parseResult.error }, 400);
  }
  
  const data = parseResult.data;
  const user = c.get('user');

  try {
    // Validate parent todo if provided
    if (data.parentId) {
      const [parent] = await db
        .select()
        .from(todos)
        .where(
          and(
            eq(todos.id, data.parentId),
            eq(todos.userId, user.id)
          )
        );

      if (!parent) {
        return c.json({ error: 'Parent todo not found or access denied' }, 404);
      }
    }

    // Create the todo
    const [newTodo] = await db
      .insert(todos)
      .values({
        title: data.title,
        description: data.description || null,
        userId: user.id,
        status: data.status || TodoStatus.TODO,
        priority: data.priority || TodoPriority.MEDIUM,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        parentId: data.parentId || null,
        isRepeatable: data.isRepeatable || false,
        repeatType: data.repeatType || null,
        repeatInterval: data.repeatInterval || null,
        repeatDaysOfWeek: data.repeatDaysOfWeek || null,
        repeatDayOfMonth: data.repeatDayOfMonth || null,
        repeatEndDate: data.repeatEndDate ? new Date(data.repeatEndDate) : null,
      })
      .returning();

    return c.json(serializeTodo(newTodo), 201);
  } catch (error) {
    console.error('Error creating todo:', error);
    return c.json({ error: 'Failed to create todo' }, 500);
  }
});

// Get a single todo by ID
todoRouter.get('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const todoId = c.req.param('id');
  const user = c.get('user');

  const [todo] = await db
    .select()
    .from(todos)
    .where(
      and(
        eq(todos.id, todoId),
        eq(todos.userId, user.id)
      )
    );

  if (!todo) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  return c.json(serializeTodo(todo));
});

// Get paginated list of todos
todoRouter.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  
  // Parse query parameters
  const parseResult = todoQuerySchema.safeParse(c.req.query());
  if (!parseResult.success) {
    return c.json({ error: 'Invalid query parameters', details: parseResult.error }, 400);
  }
  
  const query = parseResult.data;

  // Build where conditions
  const conditions = [eq(todos.userId, user.id)];
  
  if (query.status) {
    conditions.push(eq(todos.status, query.status));
  }
  
  if (query.priority) {
    conditions.push(eq(todos.priority, query.priority));
  }
  
  if (query.parentId) {
    conditions.push(eq(todos.parentId, query.parentId));
  } else if (query.parentId === null) {
    conditions.push(isNull(todos.parentId));
  }
  
  if (query.isRepeatable !== undefined) {
    conditions.push(eq(todos.isRepeatable, query.isRepeatable));
  }

  // Get total count
  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(todos)
    .where(and(...conditions));

  // Build order by
  let orderColumn;
  switch (query.sortBy) {
    case 'updatedAt':
      orderColumn = todos.updatedAt;
      break;
    case 'dueDate':
      orderColumn = todos.dueDate;
      break;
    case 'priority':
      orderColumn = todos.priority;
      break;
    default:
      orderColumn = todos.createdAt;
      break;
  }

  const orderFn = query.sortOrder === 'asc' ? asc : desc;

  // Get paginated results
  const offset = (query.page - 1) * query.limit;
  const results = await db
    .select()
    .from(todos)
    .where(and(...conditions))
    .orderBy(orderFn(orderColumn))
    .limit(query.limit)
    .offset(offset);

  const response: PaginatedTodos = {
    todos: serializeTodos(results),
    total: totalCount,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(totalCount / query.limit),
  };

  return c.json(response);
});

// Update a todo
todoRouter.patch('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const todoId = c.req.param('id');
  const user = c.get('user');
  const body = await c.req.json();
  
  // Validate input
  const parseResult = updateTodoSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: 'Invalid input', details: parseResult.error }, 400);
  }
  
  const data = parseResult.data;

  try {
    // Check if todo exists and belongs to user
    const [existingTodo] = await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.id, todoId),
          eq(todos.userId, user.id)
        )
      );

    if (!existingTodo) {
      return c.json({ error: 'Todo not found' }, 404);
    }

    // Validate parent todo if updating parentId
    if (data.parentId !== undefined && data.parentId !== null) {
      const [parent] = await db
        .select()
        .from(todos)
        .where(
          and(
            eq(todos.id, data.parentId),
            eq(todos.userId, user.id)
          )
        );

      if (!parent) {
        return c.json({ error: 'Parent todo not found or access denied' }, 404);
      }

      // Prevent circular dependencies
      if (parent.parentId === todoId) {
        return c.json({ error: 'Circular dependency detected' }, 400);
      }
    }

    // Update the todo - convert dates and filter out undefined values
    const updateData: Partial<NewTodo> = {
      updatedAt: new Date(),
    };
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    if (data.isRepeatable !== undefined) updateData.isRepeatable = data.isRepeatable;
    if (data.repeatType !== undefined) updateData.repeatType = data.repeatType;
    if (data.repeatInterval !== undefined) updateData.repeatInterval = data.repeatInterval;
    if (data.repeatDaysOfWeek !== undefined) updateData.repeatDaysOfWeek = data.repeatDaysOfWeek;
    if (data.repeatDayOfMonth !== undefined) updateData.repeatDayOfMonth = data.repeatDayOfMonth;
    if (data.repeatEndDate !== undefined) updateData.repeatEndDate = data.repeatEndDate ? new Date(data.repeatEndDate) : null;
    
    const [updatedTodo] = await db
      .update(todos)
      .set(updateData)
      .where(eq(todos.id, todoId))
      .returning();

    return c.json(serializeTodo(updatedTodo));
  } catch (error) {
    console.error('Error updating todo:', error);
    return c.json({ error: 'Failed to update todo' }, 500);
  }
});

// Delete a todo
todoRouter.delete('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const todoId = c.req.param('id');
  const user = c.get('user');

  try {
    // Check if todo exists and belongs to user
    const [existingTodo] = await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.id, todoId),
          eq(todos.userId, user.id)
        )
      );

    if (!existingTodo) {
      return c.json({ error: 'Todo not found' }, 404);
    }

    // Delete the todo and its children
    // First delete all child todos
    await db
      .delete(todos)
      .where(
        and(
          eq(todos.parentId, todoId),
          eq(todos.userId, user.id)
        )
      );

    // Then delete the parent todo
    await db
      .delete(todos)
      .where(eq(todos.id, todoId));

    return c.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return c.json({ error: 'Failed to delete todo' }, 500);
  }
});

// Toggle todo status
todoRouter.post('/:id/toggle-status', async (c) => {
  const db = drizzle(c.env.DB);
  const todoId = c.req.param('id');
  const user = c.get('user');

  try {
    // Get current todo
    const [todo] = await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.id, todoId),
          eq(todos.userId, user.id)
        )
      );

    if (!todo) {
      return c.json({ error: 'Todo not found' }, 404);
    }

    // Determine new status
    let newStatus: TodoStatusType;
    switch (todo.status) {
      case TodoStatus.TODO:
        newStatus = TodoStatus.IN_PROGRESS;
        break;
      case TodoStatus.IN_PROGRESS:
        newStatus = TodoStatus.DONE;
        break;
      case TodoStatus.DONE:
        newStatus = TodoStatus.TODO;
        break;
      default:
        newStatus = TodoStatus.TODO;
    }

    // Update status
    const [updatedTodo] = await db
      .update(todos)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(todos.id, todoId))
      .returning();

    return c.json(serializeTodo(updatedTodo));
  } catch (error) {
    console.error('Error toggling todo status:', error);
    return c.json({ error: 'Failed to toggle todo status' }, 500);
  }
});

// Get children of a todo
todoRouter.get('/:id/children', async (c) => {
  const db = drizzle(c.env.DB);
  const parentId = c.req.param('id');
  const user = c.get('user');

  // Check if parent todo exists and belongs to user
  const [parentTodo] = await db
    .select()
    .from(todos)
    .where(
      and(
        eq(todos.id, parentId),
        eq(todos.userId, user.id)
      )
    );

  if (!parentTodo) {
    return c.json({ error: 'Parent todo not found' }, 404);
  }

  // Get all children
  const children = await db
    .select()
    .from(todos)
    .where(
      and(
        eq(todos.parentId, parentId),
        eq(todos.userId, user.id)
      )
    )
    .orderBy(desc(todos.createdAt));

  return c.json(serializeTodos(children));
});

export { todoRouter };