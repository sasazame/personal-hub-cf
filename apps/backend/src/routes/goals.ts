import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq, desc, asc, gte, lte, sql } from 'drizzle-orm';
import {
  goals,
  goalProgress,
} from '@personal-hub/shared';
import type { Goal as DbGoal, GoalProgress as DbGoalProgress } from '@personal-hub/shared/src/db/schema';
import {
  createGoalSchema,
  updateGoalSchema,
  goalProgressSchema,
  goalQuerySchema,
  type Goal,
  type GoalProgressType,
  type PaginatedGoals,
  type GoalWithProgress,
  GoalStatus,
  GoalType,
} from '@personal-hub/shared';
type Env = {
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: { id: string };
    session: { id: string };
  };
};

const goalRouter = new Hono<Env>();

// Helper to serialize database goal to API goal
function serializeGoal(goal: DbGoal): Goal {
  return {
    id: goal.id,
    userId: goal.userId,
    title: goal.title,
    description: goal.description,
    type: goal.type as GoalType,
    targetValue: goal.targetValue,
    currentValue: goal.currentValue || 0,
    unit: goal.unit,
    startDate: new Date(goal.startDate).toISOString(),
    endDate: new Date(goal.endDate).toISOString(),
    status: (goal.status || GoalStatus.ACTIVE) as GoalStatus,
    color: goal.color,
    createdAt: new Date(goal.createdAt).toISOString(),
    updatedAt: new Date(goal.updatedAt).toISOString(),
  };
}

// Helper to serialize goal progress
function serializeGoalProgress(progress: DbGoalProgress): GoalProgressType {
  return {
    id: progress.id,
    goalId: progress.goalId,
    value: progress.value,
    note: progress.note,
    date: new Date(progress.date).toISOString(),
    createdAt: new Date(progress.createdAt).toISOString(),
  };
}

// Create a new goal
goalRouter.post('/', zValidator('json', createGoalSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const data = c.req.valid('json');

  try {
    const [newGoal] = await db
      .insert(goals)
      .values({
        userId: user.id,
        title: data.title,
        description: data.description,
        type: data.type,
        targetValue: data.targetValue,
        unit: data.unit,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: GoalStatus.ACTIVE,
        color: data.color,
        currentValue: 0,
      })
      .returning();

    return c.json(serializeGoal(newGoal), 201);
  } catch (error) {
    console.error('Error creating goal:', error);
    return c.json({ error: 'Failed to create goal' }, 500);
  }
});

// Get a single goal by ID with progress
goalRouter.get('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const goalId = c.req.param('id');
  const user = c.get('user');

  const [goal] = await db
    .select()
    .from(goals)
    .where(
      and(
        eq(goals.id, goalId),
        eq(goals.userId, user.id)
      )
    );

  if (!goal) {
    return c.json({ error: 'Goal not found' }, 404);
  }

  // Get progress entries for the goal
  const progressEntries = await db
    .select()
    .from(goalProgress)
    .where(eq(goalProgress.goalId, goalId))
    .orderBy(desc(goalProgress.date));

  const response: GoalWithProgress = {
    ...serializeGoal(goal),
    progress: progressEntries.map(serializeGoalProgress),
  };

  return c.json(response);
});

// Get paginated list of goals
goalRouter.get('/', zValidator('query', goalQuerySchema), async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const query = c.req.valid('query');

  // Build where conditions
  const conditions = [eq(goals.userId, user.id)];
  
  if (query.type) {
    conditions.push(eq(goals.type, query.type));
  }
  
  if (query.status) {
    conditions.push(eq(goals.status, query.status));
  }
  
  if (query.startDate) {
    conditions.push(gte(goals.startDate, new Date(query.startDate)));
  }
  
  if (query.endDate) {
    conditions.push(lte(goals.endDate, new Date(query.endDate)));
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(goals)
    .where(and(...conditions));

  // Get paginated goals
  const limit = query.limit;
  const offset = (query.page - 1) * limit;
  
  const userGoals = await db
    .select()
    .from(goals)
    .where(and(...conditions))
    .orderBy(desc(goals.createdAt))
    .limit(limit)
    .offset(offset);

  const response: PaginatedGoals = {
    goals: userGoals.map(serializeGoal),
    totalPages: Math.ceil(count / limit),
    currentPage: query.page,
    totalCount: count,
  };

  return c.json(response);
});

// Update a goal
goalRouter.put('/:id', zValidator('json', updateGoalSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const goalId = c.req.param('id');
  const user = c.get('user');
  const data = c.req.valid('json');

  try {
    // Check if goal exists and belongs to user
    const [existingGoal] = await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.id, goalId),
          eq(goals.userId, user.id)
        )
      );

    if (!existingGoal) {
      return c.json({ error: 'Goal not found' }, 404);
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.targetValue !== undefined) updateData.targetValue = data.targetValue;
    if (data.currentValue !== undefined) updateData.currentValue = data.currentValue;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.color !== undefined) updateData.color = data.color;

    const [updatedGoal] = await db
      .update(goals)
      .set(updateData)
      .where(
        and(
          eq(goals.id, goalId),
          eq(goals.userId, user.id)
        )
      )
      .returning();

    return c.json(serializeGoal(updatedGoal));
  } catch (error) {
    console.error('Error updating goal:', error);
    return c.json({ error: 'Failed to update goal' }, 500);
  }
});

// Delete a goal
goalRouter.delete('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const goalId = c.req.param('id');
  const user = c.get('user');

  try {
    // Check if goal exists and belongs to user
    const [existingGoal] = await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.id, goalId),
          eq(goals.userId, user.id)
        )
      );

    if (!existingGoal) {
      return c.json({ error: 'Goal not found' }, 404);
    }

    // Delete the goal (cascade will handle progress entries)
    await db
      .delete(goals)
      .where(
        and(
          eq(goals.id, goalId),
          eq(goals.userId, user.id)
        )
      );

    return c.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return c.json({ error: 'Failed to delete goal' }, 500);
  }
});

// Add progress to a goal
goalRouter.post('/:id/progress', zValidator('json', goalProgressSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const goalId = c.req.param('id');
  const user = c.get('user');
  const data = c.req.valid('json');

  try {
    // Check if goal exists and belongs to user
    const [goal] = await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.id, goalId),
          eq(goals.userId, user.id)
        )
      );

    if (!goal) {
      return c.json({ error: 'Goal not found' }, 404);
    }

    // Add progress entry
    const [progressEntry] = await db
      .insert(goalProgress)
      .values({
        goalId,
        value: data.value,
        note: data.note,
        date: data.date ? new Date(data.date) : new Date(),
      })
      .returning();

    // Update the goal's current value
    const newCurrentValue = (goal.currentValue || 0) + data.value;
    
    await db
      .update(goals)
      .set({
        currentValue: newCurrentValue,
        updatedAt: new Date(),
      })
      .where(eq(goals.id, goalId));

    return c.json(serializeGoalProgress(progressEntry), 201);
  } catch (error) {
    console.error('Error adding goal progress:', error);
    return c.json({ error: 'Failed to add goal progress' }, 500);
  }
});

// Delete a progress entry
goalRouter.delete('/:goalId/progress/:progressId', async (c) => {
  const db = drizzle(c.env.DB);
  const { goalId, progressId } = c.req.param();
  const user = c.get('user');

  try {
    // Check if goal exists and belongs to user
    const [goal] = await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.id, goalId),
          eq(goals.userId, user.id)
        )
      );

    if (!goal) {
      return c.json({ error: 'Goal not found' }, 404);
    }

    // Get the progress entry to be deleted
    const [progressEntry] = await db
      .select()
      .from(goalProgress)
      .where(
        and(
          eq(goalProgress.id, progressId),
          eq(goalProgress.goalId, goalId)
        )
      );

    if (!progressEntry) {
      return c.json({ error: 'Progress entry not found' }, 404);
    }

    // Delete the progress entry
    await db
      .delete(goalProgress)
      .where(eq(goalProgress.id, progressId));

    // Update the goal's current value
    const newCurrentValue = Math.max(0, (goal.currentValue || 0) - progressEntry.value);
    
    await db
      .update(goals)
      .set({
        currentValue: newCurrentValue,
        updatedAt: new Date(),
      })
      .where(eq(goals.id, goalId));

    return c.json({ message: 'Progress entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting progress entry:', error);
    return c.json({ error: 'Failed to delete progress entry' }, 500);
  }
});

export { goalRouter };