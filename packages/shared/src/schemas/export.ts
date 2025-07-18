import { z } from 'zod';

export const exportFormats = ['csv', 'json'] as const;
export type ExportFormat = typeof exportFormats[number];

// Base export query schema
export const baseExportQuerySchema = z.object({
  format: z.enum(exportFormats).default('json'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// Todo export query schema
export const todoExportQuerySchema = baseExportQuerySchema.extend({
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

// Goals export query schema
export const goalExportQuerySchema = baseExportQuerySchema.extend({
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  type: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']).optional(),
});

// Events export query schema
export const eventExportQuerySchema = baseExportQuerySchema.extend({
  allDay: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
});

// Notes export query schema
export const noteExportQuerySchema = baseExportQuerySchema.extend({
  tags: z.string().optional(), // comma-separated tags
});

// Moments export query schema
export const momentExportQuerySchema = baseExportQuerySchema.extend({
  tags: z.string().optional(), // comma-separated tags
});

// Pomodoro export query schema
export const pomodoroExportQuerySchema = baseExportQuerySchema.extend({
  sessionType: z.enum(['work', 'short_break', 'long_break']).optional(),
  completed: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
});

// Export response types
export interface ExportMetadata {
  exportDate: string;
  recordCount: number;
  filters: Record<string, any>;
}

export interface JsonExportResponse<T> {
  metadata: ExportMetadata;
  data: T[];
}