import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, or, like, sql, desc, asc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import {
  notes,
  createNoteSchema,
  updateNoteSchema,
  listNotesQuerySchema,
  noteToResponse,
  requestToNewNote,
  type NotesListResponse,
} from '@personal-hub/shared';
import type { AuthEnv } from '../types';
import { requireAuth } from '../middleware/auth';

const app = new Hono<AuthEnv>();

// List notes with filtering and pagination
app.get('/', requireAuth, zValidator('query', listNotesQuerySchema), async (c) => {
  const user = c.get('user');
  const query = c.req.valid('query');
  const db = drizzle(c.env.DB);

  // Build query conditions
  const conditions = [eq(notes.userId, user.id)];

  // Search in title and content
  if (query.search) {
    const searchCondition = or(
      like(notes.title, `%${query.search}%`),
      like(notes.content, `%${query.search}%`)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  // Filter by tags
  if (query.tags && query.tags.length > 0) {
    const tagConditions = query.tags.map(tag => 
      like(notes.tags, `%"${tag}"%`)
    );
    const tagCondition = or(...tagConditions);
    if (tagCondition) {
      conditions.push(tagCondition);
    }
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notes)
    .where(and(...conditions));

  // Determine sort order
  const sortColumn = query.sortBy === 'title' ? notes.title : 
                    query.sortBy === 'createdAt' ? notes.createdAt : 
                    notes.updatedAt;
  const sortOrder = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Get paginated notes
  const notesList = await db
    .select()
    .from(notes)
    .where(and(...conditions))
    .orderBy(sortOrder)
    .limit(query.limit)
    .offset(query.offset);

  const response: NotesListResponse = {
    notes: notesList.map(noteToResponse),
    total: count,
    limit: query.limit,
    offset: query.offset,
  };

  return c.json(response);
});

// Get single note
app.get('/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const noteId = c.req.param('id');
  const db = drizzle(c.env.DB);

  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)));

  if (!note) {
    return c.json({ error: 'Note not found' }, 404);
  }

  return c.json(noteToResponse(note));
});

// Create note
app.post('/', requireAuth, zValidator('json', createNoteSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const newNote = requestToNewNote(data, user.id);
  
  const [createdNote] = await db
    .insert(notes)
    .values(newNote)
    .returning();

  return c.json(noteToResponse(createdNote), 201);
});

// Update note
app.put('/:id', requireAuth, zValidator('json', updateNoteSchema), async (c) => {
  const user = c.get('user');
  const noteId = c.req.param('id');
  const updates = c.req.valid('json');
  const db = drizzle(c.env.DB);

  // Check if note exists and belongs to user
  const [existingNote] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)));

  if (!existingNote) {
    return c.json({ error: 'Note not found' }, 404);
  }

  // Build update data
  const updateData: Partial<typeof notes.$inferInsert> = {
    title: updates.title,
    content: updates.content,
    tags: updates.tags ? JSON.stringify(updates.tags) : undefined,
    updatedAt: new Date(),
  };

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key as keyof typeof updateData] === undefined) {
      delete updateData[key as keyof typeof updateData];
    }
  });

  const [updatedNote] = await db
    .update(notes)
    .set(updateData)
    .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
    .returning();

  return c.json(noteToResponse(updatedNote));
});

// Delete note
app.delete('/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const noteId = c.req.param('id');
  const db = drizzle(c.env.DB);

  // Check if note exists and belongs to user
  const [existingNote] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)));

  if (!existingNote) {
    return c.json({ error: 'Note not found' }, 404);
  }

  await db
    .delete(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)));

  return c.json({ message: 'Note deleted successfully' });
});

export default app;