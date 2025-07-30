import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, asc, or, gte, lte, sql } from 'drizzle-orm';
import { todos } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { springBootValidator } from '../utils/validation';
import { createErrorResponse, ErrorCodes, StatusCodes } from '../utils/spring-boot-compat';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Validation schemas
const createTodoSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  parentId: z.number().optional(),
  isRepeatable: z.boolean().optional(),
  repeatType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  repeatInterval: z.number().optional(),
  repeatDaysOfWeek: z.array(z.number()).optional(),
  repeatDayOfMonth: z.number().optional(),
  repeatEndDate: z.string().optional(),
});

const updateTodoSchema = createTodoSchema.partial();

const querySchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  search: z.string().optional(),
  parentId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sort: z.enum(['createdAt', 'dueDate', 'priority']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

// GET /todos
app.get('/', zValidator('query', querySchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const query = c.req.valid('query');
  
  try {
    const conditions = [eq(todos.userId, userId as string)];
    
    if (query.status) {
      conditions.push(eq(todos.status, query.status));
    }
    
    if (query.priority) {
      conditions.push(eq(todos.priority, query.priority));
    }
    
    if (query.parentId) {
      conditions.push(eq(todos.parentId, parseInt(query.parentId)));
    }
    
    if (query.search) {
      const searchCondition = or(
        sql`${todos.title} LIKE ${`%${query.search}%`}`,
        sql`${todos.description} LIKE ${`%${query.search}%`}`
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
    
    if (query.fromDate) {
      conditions.push(gte(todos.dueDate, query.fromDate));
    }
    
    if (query.toDate) {
      conditions.push(lte(todos.dueDate, query.toDate));
    }
    
    const orderBy = query.sort === 'dueDate' ? todos.dueDate :
                   query.sort === 'priority' ? todos.priority :
                   todos.createdAt;
    
    const order = query.order === 'asc' ? asc : desc;
    
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    
    const [items, totalResult] = await Promise.all([
      db.select()
        .from(todos)
        .where(and(...conditions))
        .orderBy(order(orderBy))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(todos)
        .where(and(...conditions))
    ]);
    
    const total = totalResult[0]?.count || 0;
    
    return c.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get todos error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// GET /todos/:id
app.get('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  try {
    const todo = await db.select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId as string)))
      .get();
    
    if (!todo) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Todo not found'),
        404 as ContentfulStatusCode
      );
    }
    
    return c.json(todo);
  } catch (error) {
    console.error('Get todo error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// POST /todos
app.post('/', zValidator('json', createTodoSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const data = c.req.valid('json');
  
  try {
    const newTodo = {
      ...data,
      userId,
      status: data.status || 'TODO',
      priority: data.priority || 'MEDIUM',
      isRepeatable: data.isRepeatable || false,
      repeatDaysOfWeek: data.repeatDaysOfWeek ? JSON.stringify(data.repeatDaysOfWeek) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const result = await db.insert(todos).values(newTodo).returning();
    const insertedTodo = Array.isArray(result) ? result[0] : result;
    
    return c.json(insertedTodo, StatusCodes.CREATED as ContentfulStatusCode);
  } catch (error) {
    console.error('Create todo error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /todos/:id
app.put('/:id', zValidator('json', updateTodoSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  
  try {
    // Check if todo exists and belongs to user
    const existing = await db.select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId as string)))
      .get();
    
    if (!existing) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Todo not found'),
        404 as ContentfulStatusCode
      );
    }
    
    const updateData = {
      ...data,
      repeatDaysOfWeek: data.repeatDaysOfWeek ? JSON.stringify(data.repeatDaysOfWeek) : existing.repeatDaysOfWeek,
      updatedAt: new Date().toISOString(),
    };
    
    const result = await db.update(todos)
      .set(updateData)
      .where(and(eq(todos.id, id), eq(todos.userId, userId as string)))
      .returning();
    
    const updatedTodo = Array.isArray(result) ? result[0] : result;
    return c.json(updatedTodo);
  } catch (error) {
    console.error('Update todo error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// DELETE /todos/:id
app.delete('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  try {
    // Check if todo exists and belongs to user
    const existing = await db.select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId as string)))
      .get();
    
    if (!existing) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Todo not found'),
        404 as ContentfulStatusCode
      );
    }
    
    await db.delete(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId as string)));
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete todo error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// POST /todos/:id/complete
app.post('/:id/complete', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  try {
    const result = await db.update(todos)
      .set({ 
        status: 'DONE',
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(todos.id, id), eq(todos.userId, userId as string)))
      .returning();
    
    const resultArray = Array.isArray(result) ? result : [];
    if (!resultArray.length) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Todo not found'),
        404 as ContentfulStatusCode
      );
    }
    
    return c.json(resultArray[0]);
  } catch (error) {
    console.error('Complete todo error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// GET /todos/:id/subtasks
app.get('/:id/subtasks', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const parentId = parseInt(c.req.param('id'));
  
  try {
    const subtasks = await db.select()
      .from(todos)
      .where(and(eq(todos.userId, userId as string), eq(todos.parentId, parentId)))
      .orderBy(asc(todos.createdAt));
    
    return c.json(subtasks);
  } catch (error) {
    console.error('Get subtasks error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

export default app;