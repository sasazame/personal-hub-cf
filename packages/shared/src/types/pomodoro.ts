import { z } from 'zod';

export const sessionTypeSchema = z.enum(['WORK', 'SHORT_BREAK', 'LONG_BREAK']);
export type SessionType = z.infer<typeof sessionTypeSchema>;

export const createPomodoroSessionSchema = z.object({
  taskId: z.string().optional(),
  sessionType: sessionTypeSchema,
  duration: z.number().int().positive(),
});

export const updatePomodoroSessionSchema = z.object({
  endTime: z.date(),
  completed: z.boolean(),
});

export const pomodoroSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  taskId: z.string().optional(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number(),
  sessionType: sessionTypeSchema,
  completed: z.boolean(),
  createdAt: z.date(),
});

export const pomodoroConfigSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workDuration: z.number().int().min(1).max(60).default(25),
  shortBreakDuration: z.number().int().min(1).max(30).default(5),
  longBreakDuration: z.number().int().min(1).max(60).default(15),
  longBreakInterval: z.number().int().min(1).max(10).default(4),
  autoStartBreaks: z.boolean().default(false),
  autoStartPomodoros: z.boolean().default(false),
  soundEnabled: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updatePomodoroConfigSchema = z.object({
  workDuration: z.number().int().min(1).max(60).optional(),
  shortBreakDuration: z.number().int().min(1).max(30).optional(),
  longBreakDuration: z.number().int().min(1).max(60).optional(),
  longBreakInterval: z.number().int().min(1).max(10).optional(),
  autoStartBreaks: z.boolean().optional(),
  autoStartPomodoros: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
});

export type PomodoroSession = z.infer<typeof pomodoroSessionSchema>;
export type CreatePomodoroSession = z.infer<typeof createPomodoroSessionSchema>;
export type UpdatePomodoroSession = z.infer<typeof updatePomodoroSessionSchema>;
export type PomodoroConfig = z.infer<typeof pomodoroConfigSchema>;
export type UpdatePomodoroConfig = z.infer<typeof updatePomodoroConfigSchema>;