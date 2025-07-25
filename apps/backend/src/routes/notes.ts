import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, or, like, isNotNull } from 'drizzle-orm';
import { notes } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { springBootValidator } from '../utils/validation';
import { createErrorResponse, ErrorCodes, StatusCodes } from '../utils/spring-boot-compat';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Validation schemas
const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  tags: z.string().optional(),
});

const updateNoteSchema = createNoteSchema.partial();

// GET /notes
app.get('/', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const search = c.req.query('search');
  const tags = c.req.query('tags');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  try {
    const conditions = [eq(notes.userId, userId)];
    
    // Search filter
    if (search) {
      conditions.push(
        or(
          like(notes.title, `%${search}%`),
          like(notes.content, `%${search}%`)
        )
      );
    }
    
    // Tags filter
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim());
      const tagConditions = tagList.map(tag => 
        like(notes.tags, `%${tag}%`)
      );
      if (tagConditions.length > 0) {
        conditions.push(or(...tagConditions));
      }
    }
    
    const [items, totalResult] = await Promise.all([
      db.select()
        .from(notes)
        .where(and(...conditions))
        .orderBy(desc(notes.updatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: notes.id })
        .from(notes)
        .where(and(...conditions))
    ]);
    
    const total = totalResult[0]?.count || 0;
    
    return c.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get notes error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// GET /notes/tags - MUST BE BEFORE /:id
app.get('/tags', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  
  try {
    // Get all notes with tags
    const notesWithTags = await db.select({ tags: notes.tags })
      .from(notes)
      .where(and(eq(notes.userId, userId), isNotNull(notes.tags)));
    
    // Extract and count unique tags
    const tagCounts: Record<string, number> = {};
    
    notesWithTags.forEach(note => {
      if (note.tags) {
        const tags = note.tags.split(',').map(t => t.trim()).filter(t => t);
        tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Convert to array and sort by count
    const tagList = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
    
    return c.json(tagList);
  } catch (error) {
    console.error('Get tags error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// GET /notes/:id
app.get('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  try {
    const note = await db.select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .get();
    
    if (!note) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Note not found'),
        StatusCodes.NOT_FOUND
      );
    }
    
    return c.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// POST /notes
app.post('/', zValidator('json', createNoteSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const data = c.req.valid('json');
  
  try {
    const newNote = {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const result = await db.insert(notes).values(newNote).returning();
    
    return c.json(result[0], 201);
  } catch (error) {
    console.error('Create note error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// PUT /notes/:id
app.put('/:id', zValidator('json', updateNoteSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  
  try {
    const existing = await db.select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .get();
    
    if (!existing) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Note not found'),
        StatusCodes.NOT_FOUND
      );
    }
    
    const result = await db.update(notes)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();
    
    return c.json(result[0]);
  } catch (error) {
    console.error('Update note error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// DELETE /notes/:id
app.delete('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  try {
    const existing = await db.select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .get();
    
    if (!existing) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Note not found'),
        StatusCodes.NOT_FOUND
      );
    }
    
    await db.delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete note error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

export default app;