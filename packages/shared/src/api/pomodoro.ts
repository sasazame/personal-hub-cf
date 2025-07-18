import { z } from 'zod';
import type { PomodoroSession, PomodoroConfig } from '../db/schema';

export const sessionTypeSchema = z.enum(['WORK', 'SHORT_BREAK', 'LONG_BREAK']);
export type SessionType = z.infer<typeof sessionTypeSchema>;

export const createSessionSchema = z.object({
  taskId: z.string().optional(),
  sessionType: sessionTypeSchema,
  duration: z.number().int().positive(),
});

export const updateSessionSchema = z.object({
  endTime: z.string().datetime(),
  completed: z.boolean(),
});

export const sessionResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  taskId: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number(),
  sessionType: sessionTypeSchema,
  completed: z.boolean(),
  createdAt: z.string().datetime(),
});

export const listSessionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sessionType: sessionTypeSchema.optional(),
  completed: z.coerce.boolean().optional(),
});

export const configResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workDuration: z.number(),
  shortBreakDuration: z.number(),
  longBreakDuration: z.number(),
  longBreakInterval: z.number(),
  autoStartBreaks: z.boolean(),
  autoStartPomodoros: z.boolean(),
  soundEnabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const updateConfigSchema = z.object({
  workDuration: z.number().int().min(1).max(60).optional(),
  shortBreakDuration: z.number().int().min(1).max(30).optional(),
  longBreakDuration: z.number().int().min(1).max(60).optional(),
  longBreakInterval: z.number().int().min(1).max(10).optional(),
  autoStartBreaks: z.boolean().optional(),
  autoStartPomodoros: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
});

export const sessionStatsResponseSchema = z.object({
  totalSessions: z.number(),
  completedSessions: z.number(),
  totalWorkTime: z.number(),
  totalBreakTime: z.number(),
  completionRate: z.number(),
  dailyStats: z.array(z.object({
    date: z.string(),
    sessions: z.number(),
    completedSessions: z.number(),
    workTime: z.number(),
    breakTime: z.number(),
  })),
});

export type CreateSessionRequest = z.infer<typeof createSessionSchema>;
export type UpdateSessionRequest = z.infer<typeof updateSessionSchema>;
export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type ConfigResponse = z.infer<typeof configResponseSchema>;
export type UpdateConfigRequest = z.infer<typeof updateConfigSchema>;
export type SessionStatsResponse = z.infer<typeof sessionStatsResponseSchema>;

export type SessionsListResponse = {
  data: SessionResponse[];
  total: number;
  limit: number;
  offset: number;
};

export function sessionToResponse(session: PomodoroSession): SessionResponse {
  return {
    id: session.id,
    userId: session.userId,
    taskId: session.taskId ?? undefined,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime?.toISOString(),
    duration: session.duration,
    sessionType: session.sessionType as SessionType,
    completed: session.completed,
    createdAt: session.createdAt.toISOString(),
  };
}

export function configToResponse(config: PomodoroConfig): ConfigResponse {
  return {
    id: config.id,
    userId: config.userId,
    workDuration: config.workDuration,
    shortBreakDuration: config.shortBreakDuration,
    longBreakDuration: config.longBreakDuration,
    longBreakInterval: config.longBreakInterval,
    autoStartBreaks: config.autoStartBreaks,
    autoStartPomodoros: config.autoStartPomodoros,
    soundEnabled: config.soundEnabled,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}

export function requestToNewSession(request: CreateSessionRequest, userId: string) {
  return {
    userId,
    taskId: request.taskId || null,
    sessionType: request.sessionType,
    duration: request.duration,
    startTime: new Date(),
    completed: false,
  };
}