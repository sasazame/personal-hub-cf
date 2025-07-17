import { z } from 'zod';

// Enums
export const TodoStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

export const TodoPriority = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;

export const RepeatType = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
  ONCE: 'ONCE',
} as const;

// Types
export type TodoStatusType = typeof TodoStatus[keyof typeof TodoStatus];
export type TodoPriorityType = typeof TodoPriority[keyof typeof TodoPriority];
export type RepeatTypeType = typeof RepeatType[keyof typeof RepeatType];

// Base Todo type (from database)
export interface Todo {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TodoStatusType;
  priority: TodoPriorityType;
  dueDate: string | null; // ISO date string
  parentId: string | null;
  isRepeatable: boolean;
  repeatType: RepeatTypeType | null;
  repeatInterval: number | null;
  repeatDaysOfWeek: string | null; // comma-separated "1,2,3"
  repeatDayOfMonth: number | null;
  repeatEndDate: string | null; // ISO date string
  originalTodoId: string | null;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

// Create Todo input
export const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional(),
  status: z.enum([TodoStatus.TODO, TodoStatus.IN_PROGRESS, TodoStatus.DONE]).optional(),
  priority: z.enum([TodoPriority.HIGH, TodoPriority.MEDIUM, TodoPriority.LOW]).optional(),
  dueDate: z.string().datetime().optional(),
  parentId: z.string().uuid().optional(),
  isRepeatable: z.boolean().optional(),
  repeatType: z.enum([RepeatType.DAILY, RepeatType.WEEKLY, RepeatType.MONTHLY, RepeatType.YEARLY, RepeatType.ONCE]).optional(),
  repeatInterval: z.number().int().positive().optional(),
  repeatDaysOfWeek: z.string().regex(/^[1-7](,[1-7])*$/).optional(), // "1,2,3" format
  repeatDayOfMonth: z.number().int().min(1).max(31).optional(),
  repeatEndDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    // If repeatable, repeat type is required
    if (data.isRepeatable && !data.repeatType) {
      return false;
    }
    return true;
  },
  {
    message: 'Repeat type is required when todo is repeatable',
    path: ['repeatType'],
  }
);

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

// Update Todo input - make all fields optional
export const updateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum([TodoStatus.TODO, TodoStatus.IN_PROGRESS, TodoStatus.DONE]).optional(),
  priority: z.enum([TodoPriority.HIGH, TodoPriority.MEDIUM, TodoPriority.LOW]).optional(),
  dueDate: z.string().datetime().optional(),
  parentId: z.string().uuid().optional(),
  isRepeatable: z.boolean().optional(),
  repeatType: z.enum([RepeatType.DAILY, RepeatType.WEEKLY, RepeatType.MONTHLY, RepeatType.YEARLY, RepeatType.ONCE]).optional(),
  repeatInterval: z.number().int().positive().optional(),
  repeatDaysOfWeek: z.string().regex(/^[1-7](,[1-7])*$/).optional(),
  repeatDayOfMonth: z.number().int().min(1).max(31).optional(),
  repeatEndDate: z.string().datetime().optional(),
});
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

// Query params for listing todos
export const todoQuerySchema = z.object({
  status: z.enum([TodoStatus.TODO, TodoStatus.IN_PROGRESS, TodoStatus.DONE]).optional(),
  priority: z.enum([TodoPriority.HIGH, TodoPriority.MEDIUM, TodoPriority.LOW]).optional(),
  parentId: z.string().uuid().optional(),
  isRepeatable: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type TodoQuery = z.infer<typeof todoQuerySchema>;

// Paginated response
export interface PaginatedTodos {
  todos: Todo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}