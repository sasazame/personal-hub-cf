import { z } from 'zod';

// Auth schemas
export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

// Common schemas
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});