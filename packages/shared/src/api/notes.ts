import { z } from 'zod';
import type { Note, NewNote } from '../db/schema';

// Base note schema
export const noteSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
});

// Create note request
export const createNoteSchema = noteSchema;
export type CreateNoteRequest = z.infer<typeof createNoteSchema>;

// Update note request
export const updateNoteSchema = noteSchema.partial();
export type UpdateNoteRequest = z.infer<typeof updateNoteSchema>;

// List notes query params
export const listNotesQuerySchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;

// Note response types
export interface NoteResponse extends Omit<Note, 'tags'> {
  tags: string[] | null;
}

export interface NotesListResponse {
  notes: NoteResponse[];
  total: number;
  limit: number;
  offset: number;
}

// Utility functions for data conversion
export function noteToResponse(note: Note): NoteResponse {
  return {
    ...note,
    tags: note.tags ? JSON.parse(note.tags) : null,
  };
}

export function requestToNewNote(
  request: CreateNoteRequest,
  userId: string
): Omit<NewNote, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId,
    title: request.title,
    content: request.content,
    tags: request.tags ? JSON.stringify(request.tags) : null,
  };
}