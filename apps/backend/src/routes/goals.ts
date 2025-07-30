import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, between } from 'drizzle-orm';
import { goals, goalAchievementHistory } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { springBootValidator } from '../utils/validation';
import { createErrorResponse, ErrorCodes, StatusCodes } from '../utils/spring-boot-compat';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Validation schemas
const createGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  goalType: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().optional(),
});

const updateGoalSchema = createGoalSchema.partial();

const achievementSchema = z.object({
  achievedDate: z.string(),
});

// GET /goals
app.get('/', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const isActive = c.req.query('isActive');
  
  try {
    const conditions = [eq(goals.userId, userId as string)];
    
    if (isActive !== undefined) {
      conditions.push(eq(goals.isActive, isActive === 'true'));
    }
    
    const items = await db.select()
      .from(goals)
      .where(and(...conditions))
      .orderBy(desc(goals.createdAt));
    
    return c.json(items);
  } catch (error) {
    console.error('Get goals error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// GET /goals/:id
app.get('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const id = parseInt(c.req.param('id'));
  
  try {
    const goal = await db.select()
      .from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId as string)))
      .get();
    
    if (!goal) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Goal not found'),
        404 as ContentfulStatusCode
      );
    }
    
    return c.json(goal);
  } catch (error) {
    console.error('Get goal error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// POST /goals
app.post('/', zValidator('json', createGoalSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const data = c.req.valid('json');
  
  try {
    const newGoal = {
      ...data,
      userId,
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const result = await db.insert(goals).values(newGoal).returning();
    
    return c.json(result[0], StatusCodes.CREATED as ContentfulStatusCode as ContentfulStatusCode);
  } catch (error) {
    console.error('Create goal error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /goals/:id
app.put('/:id', zValidator('json', updateGoalSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  
  try {
    const existing = await db.select()
      .from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId as string)))
      .get();
    
    if (!existing) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Goal not found'),
        404 as ContentfulStatusCode
      );
    }
    
    const result = await db.update(goals)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(goals.id, id), eq(goals.userId, userId as string)))
      .returning();
    
    return c.json(result[0]);
  } catch (error) {
    console.error('Update goal error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// DELETE /goals/:id
app.delete('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const id = parseInt(c.req.param('id'));
  
  try {
    const existing = await db.select()
      .from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId as string)))
      .get();
    
    if (!existing) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Goal not found'),
        404 as ContentfulStatusCode
      );
    }
    
    await db.delete(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId as string)));
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete goal error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// GET /goals/:id/achievements
app.get('/:id/achievements', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const goalId = parseInt(c.req.param('id'));
  const fromDate = c.req.query('fromDate');
  const toDate = c.req.query('toDate');
  
  try {
    // Verify goal belongs to user
    const goal = await db.select()
      .from(goals)
      .where(and(eq(goals.id, goalId), eq(goals.userId, userId as string)))
      .get();
    
    if (!goal) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Goal not found'),
        404 as ContentfulStatusCode
      );
    }
    
    const conditions = [eq(goalAchievementHistory.goalId, goalId)];
    
    if (fromDate && toDate) {
      conditions.push(between(goalAchievementHistory.achievedDate, fromDate, toDate));
    }
    
    const achievements = await db.select()
      .from(goalAchievementHistory)
      .where(and(...conditions))
      .orderBy(desc(goalAchievementHistory.achievedDate));
    
    return c.json(achievements);
  } catch (error) {
    console.error('Get achievements error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// POST /goals/:id/achievements
app.post('/:id/achievements', zValidator('json', achievementSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const goalId = parseInt(c.req.param('id'));
  const { achievedDate } = c.req.valid('json');
  
  try {
    // Verify goal belongs to user
    const goal = await db.select()
      .from(goals)
      .where(and(eq(goals.id, goalId), eq(goals.userId, userId as string)))
      .get();
    
    if (!goal) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Goal not found'),
        404 as ContentfulStatusCode
      );
    }
    
    // Check if achievement already exists for this date
    const existing = await db.select()
      .from(goalAchievementHistory)
      .where(and(
        eq(goalAchievementHistory.goalId, goalId),
        eq(goalAchievementHistory.achievedDate, achievedDate)
      ))
      .get();
    
    if (existing) {
      return c.json(
        createErrorResponse(ErrorCodes.CONFLICT, 'Achievement already recorded for this date'),
        StatusCodes.CONFLICT as ContentfulStatusCode as ContentfulStatusCode
      );
    }
    
    const result = await db.insert(goalAchievementHistory)
      .values({
        goalId,
        achievedDate,
        createdAt: new Date().toISOString(),
      })
      .returning();
    
    return c.json(result[0], StatusCodes.CREATED as ContentfulStatusCode as ContentfulStatusCode);
  } catch (error) {
    console.error('Create achievement error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// DELETE /goals/:goalId/achievements/:id
app.delete('/:goalId/achievements/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const goalId = parseInt(c.req.param('goalId'));
  const achievementId = parseInt(c.req.param('id'));
  
  try {
    // Verify goal belongs to user
    const goal = await db.select()
      .from(goals)
      .where(and(eq(goals.id, goalId), eq(goals.userId, userId as string)))
      .get();
    
    if (!goal) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Goal not found'),
        404 as ContentfulStatusCode
      );
    }
    
    const result = await db.delete(goalAchievementHistory)
      .where(and(
        eq(goalAchievementHistory.id, achievementId),
        eq(goalAchievementHistory.goalId, goalId)
      ))
      .returning();
    
    if (!result.length) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Achievement not found'),
        404
      );
    }
    
    return c.body(null, 204);
  } catch (error) {
    console.error('Delete achievement error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

export default app;