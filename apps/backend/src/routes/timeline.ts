import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { and, between, eq, gte, lte, or, like } from 'drizzle-orm';
import { timelineEntries, events } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { createLocalizedError } from '../utils/i18n';
import { springBootValidator } from '../utils/validation';
import { createValidationError, StatusCodes } from '../utils/spring-boot-compat';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', authMiddleware);

const timelineEntrySchema = z.object({
  title: z.string().min(1),
  memo: z.string().optional(),
  category: z.string().max(80).optional(),
  tags: z.string().optional(),
  date: z.string(), // ISO date yyyy-mm-dd
  eventId: z.number().optional(),
});

const updateSchema = timelineEntrySchema.partial();

app.get('/', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const fromDate = c.req.query('fromDate') || c.req.query('startDate');
  const toDate = c.req.query('toDate') || c.req.query('endDate');
  const search = c.req.query('search');
  const category = c.req.query('category');
  const tag = c.req.query('tag');

  try {
    const conditions = [eq(timelineEntries.userId, userId)];

    if (fromDate && toDate) {
      conditions.push(between(timelineEntries.date, fromDate, toDate));
    } else if (fromDate) {
      conditions.push(gte(timelineEntries.date, fromDate));
    } else if (toDate) {
      conditions.push(lte(timelineEntries.date, toDate));
    }

    if (category) {
      conditions.push(eq(timelineEntries.category, category));
    }

    if (tag) {
      conditions.push(like(timelineEntries.tags, `%${tag}%`));
    }

    if (search) {
      const likeSearch = `%${search}%`;
      conditions.push(
        or(
          like(timelineEntries.title, likeSearch),
          like(timelineEntries.memo, likeSearch),
          like(timelineEntries.tags, likeSearch),
          like(timelineEntries.category, likeSearch),
        )
      );
    }

    const items = await db.select()
      .from(timelineEntries)
      .where(and(...conditions))
      .orderBy(timelineEntries.date);

    return c.json(items);
  } catch (error) {
    console.error('Get timeline error:', error);
    return c.json(createLocalizedError('INTERNAL_ERROR', c), 500 as ContentfulStatusCode);
  }
});

app.post('/', zValidator('json', timelineEntrySchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const data = c.req.valid('json');

  try {
    const newEntry = {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.insert(timelineEntries).values(newEntry).returning();
    return c.json(result[0], StatusCodes.CREATED as ContentfulStatusCode);
  } catch (error) {
    console.error('Create timeline error:', error);
    return c.json(createLocalizedError('INTERNAL_ERROR', c), 500 as ContentfulStatusCode);
  }
});

app.put('/:id', zValidator('json', updateSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');

  try {
    const existing = await db.select()
      .from(timelineEntries)
      .where(and(eq(timelineEntries.id, id), eq(timelineEntries.userId, userId)))
      .get();

    if (!existing) {
      return c.json(createLocalizedError('NOT_FOUND', c, { detail: 'Timeline entry not found' }), 404);
    }

    const result = await db.update(timelineEntries)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(timelineEntries.id, id), eq(timelineEntries.userId, userId)))
      .returning();

    return c.json(result[0]);
  } catch (error) {
    console.error('Update timeline error:', error);
    return c.json(createLocalizedError('INTERNAL_ERROR', c), 500 as ContentfulStatusCode);
  }
});

app.delete('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const id = parseInt(c.req.param('id'));

  try {
    const existing = await db.select()
      .from(timelineEntries)
      .where(and(eq(timelineEntries.id, id), eq(timelineEntries.userId, userId)))
      .get();

    if (!existing) {
      return c.json(createLocalizedError('NOT_FOUND', c, { detail: 'Timeline entry not found' }), 404);
    }

    await db.delete(timelineEntries)
      .where(and(eq(timelineEntries.id, id), eq(timelineEntries.userId, userId)));

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete timeline error:', error);
    return c.json(createLocalizedError('INTERNAL_ERROR', c), 500 as ContentfulStatusCode);
  }
});

// Import a calendar event as a timeline entry
app.post('/import/:eventId', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const eventId = parseInt(c.req.param('eventId'));

  try {
    const event = await db.select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.userId, userId)))
      .get();

    if (!event) {
      return c.json(createValidationError({ eventId: 'Event not found' }), 404);
    }

    const dateOnly = event.startDateTime.slice(0, 10);
    const newEntry = {
      title: event.title,
      memo: event.description || '',
      category: 'calendar',
      tags: null as string | null,
      date: dateOnly,
      eventId,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.insert(timelineEntries).values(newEntry).returning();
    return c.json(result[0], StatusCodes.CREATED as ContentfulStatusCode);
  } catch (error) {
    console.error('Import timeline error:', error);
    return c.json(createLocalizedError('INTERNAL_ERROR', c), 500 as ContentfulStatusCode);
  }
});

export default app;
