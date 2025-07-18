import { z } from 'zod';

export const searchRequestSchema = z.object({
  query: z.string().min(1),
  types: z.array(z.enum(['todos', 'goals', 'events', 'notes', 'moments'])).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const searchResultItemSchema = z.object({
  id: z.string(),
  type: z.enum(['todos', 'goals', 'events', 'notes', 'moments']),
  title: z.string(),
  content: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  url: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const searchResponseSchema = z.object({
  results: z.array(searchResultItemSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  query: z.string(),
  types: z.array(z.string()).optional(),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type SearchResultItem = z.infer<typeof searchResultItemSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;