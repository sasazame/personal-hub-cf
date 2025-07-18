import { Hono } from 'hono';
import type { AuthEnv as Env } from '../types';
import { requireAuth } from '../middleware/auth';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq, gte, lte, desc, sql } from 'drizzle-orm';
import { 
  todos, 
  goals, 
  events, 
  notes, 
  moments, 
  pomodoroSessions
} from '@personal-hub/shared';
import { 
  dashboardQuerySchema, 
  type DashboardStats, 
  type ActivityItem,
  type DashboardActivity 
} from '@personal-hub/shared';

const dashboard = new Hono<Env>();

// Apply auth middleware to all routes
dashboard.use('*', requireAuth);

// Get dashboard statistics
dashboard.get('/stats', async (c) => {
  const user = c.get('user')!;
  const userId = user.id;
  const query = c.req.query();
  
  const result = dashboardQuerySchema.safeParse(query);
  if (!result.success) {
    return c.json({ error: 'Invalid query parameters', details: result.error.flatten() }, 400);
  }
  
  const { recentItemsLimit } = result.data;
  const db = drizzle(c.env.DB);
  
  // Get current date for calculations
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Fetch todos stats
  const [todoStats, recentTodos] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when status = 'COMPLETED' then 1 else 0 end)`,
      pending: sql<number>`sum(case when status = 'TODO' then 1 else 0 end)`
    })
    .from(todos)
    .where(eq(todos.userId, userId))
    .get(),
    
    db.select()
    .from(todos)
    .where(eq(todos.userId, userId))
    .orderBy(desc(todos.createdAt))
    .limit(recentItemsLimit)
    .all()
  ]);

  // Fetch goals stats
  const [goalStats, recentGoals] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`,
      inProgress: sql<number>`sum(case when status = 'ACTIVE' then 1 else 0 end)`,
      completed: sql<number>`sum(case when status = 'COMPLETED' then 1 else 0 end)`
    })
    .from(goals)
    .where(eq(goals.userId, userId))
    .get(),
    
    db.select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.createdAt))
    .limit(recentItemsLimit)
    .all()
  ]);

  // Fetch events stats
  const [eventStats, recentEvents] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`
    })
    .from(events)
    .where(eq(events.userId, userId))
    .get(),
    
    db.select()
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        gte(events.startDateTime, now)
      )
    )
    .orderBy(events.startDateTime)
    .limit(recentItemsLimit)
    .all()
  ]);

  // Count upcoming and today's events
  const upcomingEvents = await db.select({ count: sql<number>`count(*)` })
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        gte(events.startDateTime, now)
      )
    )
    .get();

  const todayEvents = await db.select({ count: sql<number>`count(*)` })
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        gte(events.startDateTime, todayStart),
        lte(events.startDateTime, todayEnd)
      )
    )
    .get();

  // Fetch notes stats
  const [noteStats, recentNotes] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`
    })
    .from(notes)
    .where(eq(notes.userId, userId))
    .get(),
    
    db.select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt))
    .limit(recentItemsLimit)
    .all()
  ]);

  // Fetch moments stats
  const [momentStats, recentMoments] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`
    })
    .from(moments)
    .where(eq(moments.userId, userId))
    .get(),
    
    db.select()
    .from(moments)
    .where(eq(moments.userId, userId))
    .orderBy(desc(moments.createdAt))
    .limit(recentItemsLimit)
    .all()
  ]);

  // Count today's moments
  const todayMoments = await db.select({ count: sql<number>`count(*)` })
    .from(moments)
    .where(
      and(
        eq(moments.userId, userId),
        gte(moments.createdAt, todayStart),
        lte(moments.createdAt, todayEnd)
      )
    )
    .get();

  // Fetch pomodoro stats
  const [todayPomodoro, weekPomodoro] = await Promise.all([
    db.select({
      sessions: sql<number>`count(*)`,
      minutes: sql<number>`sum(duration)`
    })
    .from(pomodoroSessions)
    .where(
      and(
        eq(pomodoroSessions.userId, userId),
        gte(pomodoroSessions.startTime, todayStart),
        lte(pomodoroSessions.startTime, todayEnd),
        eq(pomodoroSessions.completed, true)
      )
    )
    .get(),
    
    db.select({
      sessions: sql<number>`count(*)`,
      minutes: sql<number>`sum(duration)`
    })
    .from(pomodoroSessions)
    .where(
      and(
        eq(pomodoroSessions.userId, userId),
        gte(pomodoroSessions.startTime, weekAgo),
        eq(pomodoroSessions.completed, true)
      )
    )
    .get()
  ]);

  // Get active pomodoro session
  const activeSession = await db.select()
    .from(pomodoroSessions)
    .where(
      and(
        eq(pomodoroSessions.userId, userId),
        eq(pomodoroSessions.completed, false)
      )
    )
    .orderBy(desc(pomodoroSessions.startTime))
    .limit(1)
    .get();

  let activePomodoroSession = null;
  if (activeSession) {
    const startedAt = activeSession.startTime;
    const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    const remainingSeconds = Math.max(0, activeSession.duration * 60 - elapsedSeconds);
    
    if (remainingSeconds > 0) {
      activePomodoroSession = {
        id: activeSession.id,
        type: activeSession.sessionType,
        remainingSeconds
      };
    } else {
      // Mark expired session as completed
      await db.update(pomodoroSessions)
        .set({ completed: true })
        .where(eq(pomodoroSessions.id, activeSession.id));
    }
  }

  const stats: DashboardStats = {
    todos: {
      total: Number(todoStats?.total || 0),
      completed: Number(todoStats?.completed || 0),
      pending: Number(todoStats?.pending || 0),
      recentItems: recentTodos.map(todo => ({
        id: todo.id,
        title: todo.title,
        completed: todo.status === 'COMPLETED',
        createdAt: todo.createdAt.toISOString()
      }))
    },
    goals: {
      total: Number(goalStats?.total || 0),
      inProgress: Number(goalStats?.inProgress || 0),
      completed: Number(goalStats?.completed || 0),
      recentItems: recentGoals.map(goal => ({
        id: goal.id,
        title: goal.title,
        status: goal.status,
        progress: goal.targetValue && goal.currentValue ? Math.round((goal.currentValue / goal.targetValue) * 100) : 0,
        createdAt: goal.createdAt.toISOString()
      }))
    },
    events: {
      total: Number(eventStats?.total || 0),
      upcoming: Number(upcomingEvents?.count || 0),
      today: Number(todayEvents?.count || 0),
      recentItems: recentEvents.map(event => ({
        id: event.id,
        title: event.title,
        startDate: event.startDateTime.toISOString(),
        endDate: event.endDateTime ? event.endDateTime.toISOString() : null,
        allDay: event.allDay
      }))
    },
    notes: {
      total: Number(noteStats?.total || 0),
      recentItems: recentNotes.map(note => ({
        id: note.id,
        title: note.title,
        tags: note.tags ? note.tags.split(',').filter(t => t.trim()) : [],
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString()
      }))
    },
    moments: {
      total: Number(momentStats?.total || 0),
      todayCount: Number(todayMoments?.count || 0),
      recentItems: recentMoments.map(moment => ({
        id: moment.id,
        content: moment.content,
        tags: moment.tags ? moment.tags.split(',').filter(t => t.trim()) : [],
        createdAt: moment.createdAt.toISOString()
      }))
    },
    pomodoro: {
      todaySessions: Number(todayPomodoro?.sessions || 0),
      todayMinutes: Math.round(Number(todayPomodoro?.minutes || 0)),
      weekSessions: Number(weekPomodoro?.sessions || 0),
      weekMinutes: Math.round(Number(weekPomodoro?.minutes || 0)),
      activeSession: activePomodoroSession
    }
  };

  return c.json(stats);
});

// Get recent activity feed
dashboard.get('/activity', async (c) => {
  const user = c.get('user')!;
  const userId = user.id;
  const query = c.req.query();
  
  const result = dashboardQuerySchema.safeParse(query);
  if (!result.success) {
    return c.json({ error: 'Invalid query parameters', details: result.error.flatten() }, 400);
  }
  
  const { activityLimit } = result.data;
  const db = drizzle(c.env.DB);
  
  // For now, we'll return recent items from all features
  // In a real implementation, you might want to have an activity log table
  const activities: ActivityItem[] = [];
  
  // Calculate per-feature limit to ensure we meet the total activityLimit
  const featureCount = 3; // todos, goals, moments
  const perFeatureLimit = Math.ceil(activityLimit / featureCount);
  
  // Get recent todos
  const recentTodos = await db.select()
    .from(todos)
    .where(eq(todos.userId, userId))
    .orderBy(desc(todos.updatedAt))
    .limit(perFeatureLimit)
    .all();
  
  recentTodos.forEach(todo => {
    activities.push({
      id: `todo-${todo.id}`,
      type: 'todo',
      action: todo.status === 'COMPLETED' ? 'completed' : 'updated',
      title: todo.title,
      description: null,
      timestamp: todo.updatedAt.toISOString(),
      metadata: { completed: todo.status === 'COMPLETED' }
    });
  });
  
  // Get recent goals
  const recentGoals = await db.select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.updatedAt))
    .limit(perFeatureLimit)
    .all();
  
  recentGoals.forEach(goal => {
    activities.push({
      id: `goal-${goal.id}`,
      type: 'goal',
      action: goal.status === 'COMPLETED' ? 'completed' : 'updated',
      title: goal.title,
      description: goal.description,
      timestamp: goal.updatedAt.toISOString(),
      metadata: { status: goal.status, progress: goal.targetValue && goal.currentValue ? Math.round((goal.currentValue / goal.targetValue) * 100) : 0 }
    });
  });
  
  // Get recent moments
  const recentMoments = await db.select()
    .from(moments)
    .where(eq(moments.userId, userId))
    .orderBy(desc(moments.createdAt))
    .limit(perFeatureLimit)
    .all();
  
  recentMoments.forEach(moment => {
    activities.push({
      id: `moment-${moment.id}`,
      type: 'moment',
      action: 'created',
      title: moment.content.substring(0, 50) + (moment.content.length > 50 ? '...' : ''),
      description: null,
      timestamp: moment.createdAt.toISOString(),
      metadata: { tags: moment.tags ? moment.tags.split(',').filter(t => t.trim()) : [] }
    });
  });
  
  // Sort all activities by timestamp and limit
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const limitedActivities = activities.slice(0, activityLimit);
  
  const response: DashboardActivity = {
    items: limitedActivities,
    hasMore: activities.length > activityLimit
  };
  
  return c.json(response);
});

export { dashboard };