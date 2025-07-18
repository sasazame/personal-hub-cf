import { z } from 'zod';

export const createMomentSchema = z.object({
  content: z.string().min(1).max(1000),
  tags: z.array(z.string()).optional().default([]),
});

export const updateMomentSchema = z.object({
  content: z.string().min(1).max(1000).optional(),
  tags: z.array(z.string()).optional(),
});

export const momentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  tag: z.string().optional(),
  search: z.string().optional(),
});

export const momentResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreateMomentInput = z.infer<typeof createMomentSchema>;
export type UpdateMomentInput = z.infer<typeof updateMomentSchema>;
export type MomentQuery = z.infer<typeof momentQuerySchema>;
export type MomentResponse = z.infer<typeof momentResponseSchema>;