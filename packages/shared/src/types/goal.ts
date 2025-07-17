import { z } from 'zod';

// Goal type enum
export const GoalTypes = {
  ANNUAL: 'ANNUAL',
  MONTHLY: 'MONTHLY',
  WEEKLY: 'WEEKLY',
  DAILY: 'DAILY',
} as const;

export type GoalType = typeof GoalTypes[keyof typeof GoalTypes];

// Goal status enum
export const GoalStatuses = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type GoalStatus = typeof GoalStatuses[keyof typeof GoalStatuses];

// Goal schema for validation
export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  type: z.enum(Object.values(GoalTypes) as [string, ...string[]]),
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
  status: z.enum(Object.values(GoalStatuses) as [string, ...string[]]).optional(),
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
  type: z.enum(['ANNUAL', 'MONTHLY', 'WEEKLY', 'DAILY']).optional(),
  status: z.enum(Object.values(GoalStatuses) as [string, ...string[]]).optional(),
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