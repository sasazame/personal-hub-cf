import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, between, gte, sql, isNotNull } from 'drizzle-orm';
import { todos, goals, goalAchievementHistory, pomodoroSessions, events, notes, moments } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { springBootValidator } from '../utils/validation';
// No spring-boot-compat imports needed as we use createLocalizedError
import { createLocalizedError } from '../utils/i18n';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Validation schema
const dateRangeSchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

// GET /analytics/overview
app.get('/overview', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  
  try {
    const [
      todoStats,
      goalStats,
      pomodoroStats,
      eventStats,
      noteStats,
      momentStats
    ] = await Promise.all([
      // Todo stats
      db.select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(case when status = 'DONE' then 1 end)`,
        inProgress: sql<number>`count(case when status = 'IN_PROGRESS' then 1 end)`,
        todo: sql<number>`count(case when status = 'TODO' then 1 end)`,
      })
      .from(todos)
      .where(eq(todos.userId, userId as string))
      .get(),
      
      // Goal stats
      db.select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(case when is_active = 1 then 1 end)`,
      })
      .from(goals)
      .where(eq(goals.userId, userId as string))
      .get(),
      
      // Pomodoro stats
      db.select({
        totalSessions: sql<number>`count(*)`,
        completedSessions: sql<number>`count(case when status = 'COMPLETED' then 1 end)`,
        totalCycles: sql<number>`sum(completed_cycles)`,
      })
      .from(pomodoroSessions)
      .where(eq(pomodoroSessions.userId, userId as string))
      .get(),
      
      // Event stats
      db.select({
        total: sql<number>`count(*)`,
        upcoming: sql<number>`count(case when start_date_time > datetime('now') then 1 end)`,
      })
      .from(events)
      .where(eq(events.userId, userId as string))
      .get(),
      
      // Note stats
      db.select({
        total: sql<number>`count(*)`,
      })
      .from(notes)
      .where(eq(notes.userId, userId as string))
      .get(),
      
      // Moment stats
      db.select({
        total: sql<number>`count(*)`,
        today: sql<number>`count(case when date(created_at) = date('now') then 1 end)`,
      })
      .from(moments)
      .where(eq(moments.userId, userId as string))
      .get(),
    ]);
    
    return c.json({
      todos: {
        total: todoStats?.total || 0,
        completed: todoStats?.completed || 0,
        inProgress: todoStats?.inProgress || 0,
        todo: todoStats?.todo || 0,
        completionRate: todoStats?.total ? (todoStats.completed / todoStats.total) : 0,
      },
      goals: {
        total: goalStats?.total || 0,
        active: goalStats?.active || 0,
      },
      pomodoro: {
        totalSessions: pomodoroStats?.totalSessions || 0,
        completedSessions: pomodoroStats?.completedSessions || 0,
        totalCycles: pomodoroStats?.totalCycles || 0,
      },
      events: {
        total: eventStats?.total || 0,
        upcoming: eventStats?.upcoming || 0,
      },
      notes: {
        total: noteStats?.total || 0,
      },
      moments: {
        total: momentStats?.total || 0,
        today: momentStats?.today || 0,
      },
    });
  } catch (error) {
    console.error('Get overview error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// GET /analytics/productivity
app.get('/productivity', zValidator('query', dateRangeSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const { fromDate, toDate } = c.req.valid('query');
  
  try {
    // Get completed todos by date
    const completedTodos = await db.select({
      date: sql<string>`date(updated_at)`,
      count: sql<number>`count(*)`,
    })
    .from(todos)
    .where(and(
      eq(todos.userId, userId as string),
      eq(todos.status, 'DONE'),
      between(todos.updatedAt, fromDate, toDate)
    ))
    .groupBy(sql`date(updated_at)`);
    
    // Get goal achievements by date
    const achievements = await db.select({
      date: goalAchievementHistory.achievedDate,
      count: sql<number>`count(*)`,
    })
    .from(goalAchievementHistory)
    .innerJoin(goals, eq(goalAchievementHistory.goalId, goals.id))
    .where(and(
      eq(goals.userId, userId as string),
      between(goalAchievementHistory.achievedDate, fromDate, toDate)
    ))
    .groupBy(goalAchievementHistory.achievedDate);
    
    // Get pomodoro sessions by date
    const pomodoroData = await db.select({
      date: sql<string>`date(created_at)`,
      sessions: sql<number>`count(*)`,
      cycles: sql<number>`sum(completed_cycles)`,
      minutes: sql<number>`sum(completed_cycles * work_duration)`,
    })
    .from(pomodoroSessions)
    .where(and(
      eq(pomodoroSessions.userId, userId as string),
      eq(pomodoroSessions.status, 'COMPLETED'),
      between(pomodoroSessions.createdAt, fromDate, toDate)
    ))
    .groupBy(sql`date(created_at)`);
    
    return c.json({
      completedTodosByDate: completedTodos,
      goalAchievementsByDate: achievements,
      pomodoroByDate: pomodoroData,
    });
  } catch (error) {
    console.error('Get productivity error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// GET /analytics/habits
app.get('/habits', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const days = parseInt(c.req.query('days') || '30');
  
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Activity streak calculation
    const activityDates = await db.select({
      date: sql<string>`date(created_at)`,
      hasActivity: sql<number>`1`,
    })
    .from(todos)
    .where(and(
      eq(todos.userId, userId as string),
      gte(todos.createdAt, startDate.toISOString())
    ))
    .groupBy(sql`date(created_at)`)
    .union(
      db.select({
        date: sql<string>`date(created_at)`,
        hasActivity: sql<number>`1`,
      })
      .from(moments)
      .where(and(
        eq(moments.userId, userId as string),
        gte(moments.createdAt, startDate.toISOString())
      ))
      .groupBy(sql`date(created_at)`)
    );
    
    // Most productive hours
    const productiveHours = await db.select({
      hour: sql<number>`cast(strftime('%H', created_at) as integer)`,
      count: sql<number>`count(*)`,
    })
    .from(todos)
    .where(and(
      eq(todos.userId, userId as string),
      eq(todos.status, 'DONE'),
      gte(todos.createdAt, startDate.toISOString())
    ))
    .groupBy(sql`strftime('%H', created_at)`)
    .orderBy(sql`count(*) desc`)
    .limit(5);
    
    // Most productive days of week
    const productiveDays = await db.select({
      dayOfWeek: sql<number>`cast(strftime('%w', created_at) as integer)`,
      count: sql<number>`count(*)`,
    })
    .from(todos)
    .where(and(
      eq(todos.userId, userId as string),
      eq(todos.status, 'DONE'),
      gte(todos.createdAt, startDate.toISOString())
    ))
    .groupBy(sql`strftime('%w', created_at)`)
    .orderBy(sql`count(*) desc`);
    
    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    const activityMap = new Map(activityDates.map(a => [a.date, true]));
    
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      if (activityMap.has(dateStr)) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    return c.json({
      currentStreak,
      longestStreak,
      mostProductiveHours: productiveHours,
      mostProductiveDays: productiveDays,
      activityDates: Array.from(activityMap.keys()),
    });
  } catch (error) {
    console.error('Get habits error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// GET /analytics/goals-progress
app.get('/goals-progress', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  
  try {
    // Get active goals with achievement count
    const activeGoals = await db.select({
      id: goals.id,
      title: goals.title,
      startDate: goals.startDate,
      endDate: goals.endDate,
      achievementCount: sql<number>`(
        select count(*) 
        from ${goalAchievementHistory} 
        where goal_id = ${goals.id}
      )`,
    })
    .from(goals)
    .where(and(
      eq(goals.userId, userId as string),
      eq(goals.isActive, true)
    ));
    
    // Calculate progress for each goal
    const goalsProgress = activeGoals.map(goal => {
      const start = new Date(goal.startDate);
      const end = new Date(goal.endDate);
      const now = new Date();
      
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const expectedAchievements = Math.floor((elapsedDays / totalDays) * totalDays);
      
      return {
        ...goal,
        totalDays,
        elapsedDays,
        expectedAchievements,
        actualAchievements: goal.achievementCount,
        progressPercentage: (goal.achievementCount / expectedAchievements) * 100 || 0,
        isOnTrack: goal.achievementCount >= expectedAchievements,
      };
    });
    
    return c.json(goalsProgress);
  } catch (error) {
    console.error('Get goals progress error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// GET /analytics/tags
app.get('/tags', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  
  try {
    // Get all tags from notes and moments
    const [noteTags, momentTags] = await Promise.all([
      db.select({ tags: notes.tags })
        .from(notes)
        .where(and(eq(notes.userId, userId as string), isNotNull(notes.tags))),
      db.select({ tags: moments.tags })
        .from(moments)
        .where(and(eq(moments.userId, userId as string), isNotNull(moments.tags))),
    ]);
    
    // Count tag occurrences
    const tagCounts: Record<string, { notes: number; moments: number; total: number }> = {};
    
    noteTags.forEach(note => {
      if (note.tags) {
        const tags = note.tags.split(',').map(t => t.trim()).filter(t => t);
        tags.forEach(tag => {
          if (!tagCounts[tag]) tagCounts[tag] = { notes: 0, moments: 0, total: 0 };
          tagCounts[tag].notes++;
          tagCounts[tag].total++;
        });
      }
    });
    
    momentTags.forEach(moment => {
      if (moment.tags) {
        const tags = moment.tags.split(',').map(t => t.trim()).filter(t => t);
        tags.forEach(tag => {
          if (!tagCounts[tag]) tagCounts[tag] = { notes: 0, moments: 0, total: 0 };
          tagCounts[tag].moments++;
          tagCounts[tag].total++;
        });
      }
    });
    
    // Convert to array and sort
    const tagAnalytics = Object.entries(tagCounts)
      .map(([tag, counts]) => ({ tag, ...counts }))
      .sort((a, b) => b.total - a.total);
    
    return c.json({
      tags: tagAnalytics,
      totalUniqueTags: tagAnalytics.length,
      mostUsedTag: tagAnalytics[0] || null,
    });
  } catch (error) {
    console.error('Get tags analytics error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// GET /analytics/time-distribution
app.get('/time-distribution', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const days = parseInt(c.req.query('days') || '7');
  
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get activity distribution by hour of day
    const hourlyDistribution = await db.select({
      hour: sql<number>`cast(strftime('%H', created_at) as integer)`,
      todos: sql<number>`count(case when 1 then 1 end)`,
    })
    .from(todos)
    .where(and(
      eq(todos.userId, userId as string),
      gte(todos.createdAt, startDate.toISOString())
    ))
    .groupBy(sql`strftime('%H', created_at)`);
    
    // Fill in missing hours
    const fullHourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const data = hourlyDistribution.find(h => h.hour === hour);
      return {
        hour,
        todos: data?.todos || 0,
      };
    });
    
    // Get day of week distribution
    const weekdayDistribution = await db.select({
      dayOfWeek: sql<number>`cast(strftime('%w', created_at) as integer)`,
      todos: sql<number>`count(*)`,
    })
    .from(todos)
    .where(and(
      eq(todos.userId, userId as string),
      gte(todos.createdAt, startDate.toISOString())
    ))
    .groupBy(sql`strftime('%w', created_at)`);
    
    return c.json({
      hourlyDistribution: fullHourlyDistribution,
      weekdayDistribution,
    });
  } catch (error) {
    console.error('Get time distribution error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

export default app;