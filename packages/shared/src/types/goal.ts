import { z } from 'zod';

// Goal type enum
export enum GoalType {
  ANNUAL = 'ANNUAL',
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
  DAILY = 'DAILY',
}

// Goal status enum
export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

// Goal schema for validation
export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  type: z.nativeEnum(GoalType),
  targetValue: z.number().positive().optional(),
  unit: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  targetValue: z.number().positive().optional(),
  currentValue: z.number().min(0).optional(),
  unit: z.string().optional(),
  status: z.nativeEnum(GoalStatus).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export const goalProgressSchema = z.object({
  value: z.number(),
  note: z.string().optional(),
  date: z.string().datetime().optional(),
});

export const goalQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  type: z.nativeEnum(GoalType).optional(),
  status: z.nativeEnum(GoalStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Type exports
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type GoalProgressInput = z.infer<typeof goalProgressSchema>;
export type GoalQuery = z.infer<typeof goalQuerySchema>;

// Response types
export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  type: GoalType;
  targetValue: number | null;
  currentValue: number;
  unit: string | null;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalProgressType {
  id: string;
  goalId: string;
  value: number;
  note: string | null;
  date: string;
  createdAt: string;
}

export interface PaginatedGoals {
  goals: Goal[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

export interface GoalWithProgress extends Goal {
  progress: GoalProgressType[];
}