import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import {
  createSessionSchema,
  updateSessionSchema,
  listSessionsQuerySchema,
  updateConfigSchema,
  sessionToResponse,
  configToResponse,
  requestToNewSession,
  type SessionsListResponse,
  type SessionStatsResponse,
} from '@personal-hub/shared';
import { pomodoroSessions, pomodoroConfigs } from '@personal-hub/shared/src/db/schema';
import type { AuthEnv } from '../types';

const app = new Hono<AuthEnv>();

// Get user's Pomodoro config
app.get('/config', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = drizzle(c.env.DB);

  // Try to get existing config
  const [config] = await db
    .select()
    .from(pomodoroConfigs)
    .where(eq(pomodoroConfigs.userId, user.id))
    .limit(1);

  if (config) {
    return c.json(configToResponse(config));
  }

  // Create default config if none exists
  const [newConfig] = await db
    .insert(pomodoroConfigs)
    .values({
      userId: user.id,
    })
    .returning();

  return c.json(configToResponse(newConfig));
});

// Update user's Pomodoro config
app.put('/config', zValidator('json', updateConfigSchema), async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const data = c.req.valid('json');
  const db = drizzle(c.env.DB);

  // Check if config exists
  const [existingConfig] = await db
    .select()
    .from(pomodoroConfigs)
    .where(eq(pomodoroConfigs.userId, user.id))
    .limit(1);

  if (!existingConfig) {
    // Create new config with provided values
    const [newConfig] = await db
      .insert(pomodoroConfigs)
      .values({
        userId: user.id,
        ...data,
      })
      .returning();

    return c.json(configToResponse(newConfig));
  }

  // Update existing config
  const [updatedConfig] = await db
    .update(pomodoroConfigs)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(pomodoroConfigs.userId, user.id))
    .returning();

  return c.json(configToResponse(updatedConfig));
});

// Create a new Pomodoro session
app.post('/sessions', zValidator('json', createSessionSchema), async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const data = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const [session] = await db
    .insert(pomodoroSessions)
    .values(requestToNewSession(data, user.id))
    .returning();

  return c.json(sessionToResponse(session), 201);
});

// Get list of Pomodoro sessions
app.get('/sessions', zValidator('query', listSessionsQuerySchema), async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const query = c.req.valid('query');
  const db = drizzle(c.env.DB);

  const conditions = [eq(pomodoroSessions.userId, user.id)];

  if (query.from) {
    conditions.push(gte(pomodoroSessions.startTime, new Date(query.from)));
  }

  if (query.to) {
    conditions.push(lte(pomodoroSessions.startTime, new Date(query.to)));
  }

  if (query.sessionType) {
    conditions.push(eq(pomodoroSessions.sessionType, query.sessionType));
  }

  if (query.completed !== undefined) {
    conditions.push(eq(pomodoroSessions.completed, query.completed));
  }

  const [sessions, [{ count }]] = await Promise.all([
    db
      .select()
      .from(pomodoroSessions)
      .where(and(...conditions))
      .orderBy(desc(pomodoroSessions.startTime))
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(pomodoroSessions)
      .where(and(...conditions)),
  ]);

  const response: SessionsListResponse = {
    data: sessions.map(sessionToResponse),
    total: count,
    limit: query.limit,
    offset: query.offset,
  };

  return c.json(response);
});

// Get a specific Pomodoro session
app.get('/sessions/:id', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const sessionId = c.req.param('id');
  const db = drizzle(c.env.DB);

  const [session] = await db
    .select()
    .from(pomodoroSessions)
    .where(and(
      eq(pomodoroSessions.id, sessionId),
      eq(pomodoroSessions.userId, user.id)
    ))
    .limit(1);

  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  return c.json(sessionToResponse(session));
});

// Update a Pomodoro session (mark as complete)
app.put('/sessions/:id', zValidator('json', updateSessionSchema), async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const sessionId = c.req.param('id');
  const data = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const [updatedSession] = await db
    .update(pomodoroSessions)
    .set({
      endTime: new Date(data.endTime),
      completed: data.completed,
    })
    .where(and(
      eq(pomodoroSessions.id, sessionId),
      eq(pomodoroSessions.userId, user.id)
    ))
    .returning();

  if (!updatedSession) {
    return c.json({ error: 'Session not found' }, 404);
  }

  return c.json(sessionToResponse(updatedSession));
});

// Get current active session
app.get('/sessions/active', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = drizzle(c.env.DB);

  const [activeSession] = await db
    .select()
    .from(pomodoroSessions)
    .where(and(
      eq(pomodoroSessions.userId, user.id),
      eq(pomodoroSessions.completed, false)
    ))
    .orderBy(desc(pomodoroSessions.startTime))
    .limit(1);

  if (!activeSession) {
    return c.json({ error: 'No active session' }, 404);
  }

  return c.json(sessionToResponse(activeSession));
});

// Get Pomodoro statistics
app.get('/stats', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = drizzle(c.env.DB);
  const days = parseInt(c.req.query('days') || '7');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Get all sessions in the date range
  const sessions = await db
    .select()
    .from(pomodoroSessions)
    .where(and(
      eq(pomodoroSessions.userId, user.id),
      gte(pomodoroSessions.startTime, startDate)
    ));

  // Calculate overall statistics
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.completed).length;
  const totalWorkTime = sessions
    .filter((s) => s.sessionType === 'WORK')
    .reduce((sum: number, s) => sum + s.duration, 0);
  const totalBreakTime = sessions
    .filter((s) => s.sessionType !== 'WORK')
    .reduce((sum: number, s) => sum + s.duration, 0);
  const completionRate = totalSessions > 0 ? completedSessions / totalSessions : 0;

  // Calculate daily statistics
  const dailyStatsMap = new Map<string, {
    sessions: number;
    completedSessions: number;
    workTime: number;
    breakTime: number;
  }>();

  sessions.forEach((session) => {
    const date = session.startTime.toISOString().split('T')[0];
    const stats = dailyStatsMap.get(date) || {
      sessions: 0,
      completedSessions: 0,
      workTime: 0,
      breakTime: 0,
    };

    stats.sessions++;
    if (session.completed) stats.completedSessions++;
    if (session.sessionType === 'WORK') {
      stats.workTime += session.duration;
    } else {
      stats.breakTime += session.duration;
    }

    dailyStatsMap.set(date, stats);
  });

  // Convert map to array and sort by date
  const dailyStats = Array.from(dailyStatsMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const response: SessionStatsResponse = {
    totalSessions,
    completedSessions,
    totalWorkTime,
    totalBreakTime,
    completionRate,
    dailyStats,
  };

  return c.json(response);
});

export default app;