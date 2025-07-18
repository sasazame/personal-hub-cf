import { z } from 'zod';

// Dashboard summary types
export const dashboardStatsSchema = z.object({
  todos: z.object({
    total: z.number(),
    completed: z.number(),
    pending: z.number(),
    recentItems: z.array(z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
      createdAt: z.string(),
    })),
  }),
  goals: z.object({
    total: z.number(),
    inProgress: z.number(),
    completed: z.number(),
    recentItems: z.array(z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      progress: z.number(),
      createdAt: z.string(),
    })),
  }),
  events: z.object({
    total: z.number(),
    upcoming: z.number(),
    today: z.number(),
    recentItems: z.array(z.object({
      id: z.string(),
      title: z.string(),
      startDate: z.string(),
      endDate: z.string().nullable(),
      allDay: z.boolean(),
    })),
  }),
  notes: z.object({
    total: z.number(),
    recentItems: z.array(z.object({
      id: z.string(),
      title: z.string(),
      tags: z.array(z.string()),
      createdAt: z.string(),
      updatedAt: z.string(),
    })),
  }),
  moments: z.object({
    total: z.number(),
    todayCount: z.number(),
    recentItems: z.array(z.object({
      id: z.string(),
      content: z.string(),
      tags: z.array(z.string()),
      createdAt: z.string(),
    })),
  }),
  pomodoro: z.object({
    todaySessions: z.number(),
    todayMinutes: z.number(),
    weekSessions: z.number(),
    weekMinutes: z.number(),
    activeSession: z.object({
      id: z.string(),
      type: z.string(),
      remainingSeconds: z.number(),
    }).nullable(),
  }),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// Dashboard activity feed
export const activityItemSchema = z.object({
  id: z.string(),
  type: z.enum(['todo', 'goal', 'event', 'note', 'moment', 'pomodoro']),
  action: z.enum(['created', 'updated', 'completed', 'deleted']),
  title: z.string(),
  description: z.string().nullable(),
  timestamp: z.string(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional(),
});

export type ActivityItem = z.infer<typeof activityItemSchema>;

export const dashboardActivitySchema = z.object({
  items: z.array(activityItemSchema),
  hasMore: z.boolean(),
});

export type DashboardActivity = z.infer<typeof dashboardActivitySchema>;

// Dashboard query parameters
export const dashboardQuerySchema = z.object({
  activityLimit: z.coerce.number().min(1).max(50).optional().default(10),
  recentItemsLimit: z.coerce.number().min(1).max(10).optional().default(5),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;