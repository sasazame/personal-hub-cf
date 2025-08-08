import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, or, like, isNotNull } from 'drizzle-orm';
import { notes } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { springBootValidator } from '../utils/validation';
import { StatusCodes } from '../utils/spring-boot-compat';
import { createLocalizedError } from '../utils/i18n';

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
  const userId = c.get('userId') as string;
  const search = c.req.query('search');
  const tags = c.req.query('tags');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  try {
    const conditions = [eq(notes.userId, userId as string)];
    
    // Search filter
    if (search) {
      const searchCondition = or(
        like(notes.title, `%${search}%`),
        like(notes.content, `%${search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
    
    // Tags filter
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim());
      const tagConditions = tagList.map(tag => 
        like(notes.tags, `%${tag}%`)
      );
      if (tagConditions.length > 0) {
        const orCondition = or(...tagConditions);
        if (orCondition) {
          conditions.push(orCondition);
        }
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
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// GET /notes/tags - MUST BE BEFORE /:id
app.get('/tags', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  
  try {
    // Get all notes with tags
    const notesWithTags = await db.select({ tags: notes.tags })
      .from(notes)
      .where(and(eq(notes.userId, userId as string), isNotNull(notes.tags)));
    
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
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// GET /notes/:id
app.get('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const id = parseInt(c.req.param('id'));
  
  try {
    const note = await db.select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId as string)))
      .get();
    
    if (!note) {
      return c.json(
        createLocalizedError('NOT_FOUND', c, { detail: 'Note not found' }),
        404 as ContentfulStatusCode
      );
    }
    
    return c.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// POST /notes
app.post('/', zValidator('json', createNoteSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const data = c.req.valid('json');
  
  try {
    const newNote = {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const result = await db.insert(notes).values(newNote).returning();
    
    return c.json(result[0], StatusCodes.CREATED as ContentfulStatusCode);
  } catch (error) {
    console.error('Create note error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /notes/:id
app.put('/:id', zValidator('json', updateNoteSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  
  try {
    const existing = await db.select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId as string)))
      .get();
    
    if (!existing) {
      return c.json(
        createLocalizedError('NOT_FOUND', c, { detail: 'Note not found' }),
        404 as ContentfulStatusCode
      );
    }
    
    const result = await db.update(notes)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(notes.id, id), eq(notes.userId, userId as string)))
      .returning();
    
    return c.json(result[0]);
  } catch (error) {
    console.error('Update note error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// DELETE /notes/:id
app.delete('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const id = parseInt(c.req.param('id'));
  
  try {
    const existing = await db.select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId as string)))
      .get();
    
    if (!existing) {
      return c.json(
        createLocalizedError('NOT_FOUND', c, { detail: 'Note not found' }),
        404 as ContentfulStatusCode
      );
    }
    
    await db.delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId as string)));
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete note error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

export default app;