import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { moments } from '@personal-hub/shared';
import {
  createMomentSchema,
  updateMomentSchema,
  momentQuerySchema,
  type MomentResponse,
} from '@personal-hub/shared';
import { zValidator } from '@hono/zod-validator';
import { verifyAuth } from '../lib/auth';
import { eq, desc, and, like, or, sql } from 'drizzle-orm';
import type { HonoEnv } from '../types';

const app = new Hono<HonoEnv>();

// List moments
app.get('/', zValidator('query', momentQuerySchema), verifyAuth, async (c) => {
  const user = c.get('user');
  const { limit, offset, tag, search } = c.req.valid('query');

  const db = drizzle(c.env.DB);

  // Build conditions
  const conditions = [eq(moments.userId, user.id)];

  // Add search condition (search in content)
  if (search) {
    conditions.push(like(moments.content, `%${search}%`));
  }

  // Add tag filter
  if (tag) {
    conditions.push(like(moments.tags, `%"${tag}"%`));
  }

  const [results, [{ count }]] = await Promise.all([
    db
      .select()
      .from(moments)
      .where(and(...conditions))
      .orderBy(desc(moments.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql`count(*)` })
      .from(moments)
      .where(and(...conditions)),
  ]);

  const items: MomentResponse[] = results.map((moment) => ({
    id: moment.id,
    userId: moment.userId,
    content: moment.content,
    tags: moment.tags ? JSON.parse(moment.tags) : [],
    createdAt: new Date(moment.createdAt),
    updatedAt: new Date(moment.updatedAt),
  }));

  return c.json({
    items,
    total: Number(count),
    limit,
    offset,
  });
});

// Get single moment
app.get('/:id', verifyAuth, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const db = drizzle(c.env.DB);
  const result = await db
    .select()
    .from(moments)
    .where(and(eq(moments.id, id), eq(moments.userId, user.id)))
    .limit(1);

  if (!result[0]) {
    return c.json({ error: 'Moment not found' }, 404);
  }

  const moment: MomentResponse = {
    id: result[0].id,
    userId: result[0].userId,
    content: result[0].content,
    tags: result[0].tags ? JSON.parse(result[0].tags) : [],
    createdAt: new Date(result[0].createdAt),
    updatedAt: new Date(result[0].updatedAt),
  };

  return c.json(moment);
});

// Create moment
app.post('/', zValidator('json', createMomentSchema), verifyAuth, async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');

  const db = drizzle(c.env.DB);
  const newMoment = {
    id: crypto.randomUUID(),
    userId: user.id,
    content: data.content,
    tags: JSON.stringify(data.tags || []),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(moments).values(newMoment);

  const response: MomentResponse = {
    id: newMoment.id,
    userId: newMoment.userId,
    content: newMoment.content,
    tags: data.tags || [],
    createdAt: newMoment.createdAt,
    updatedAt: newMoment.updatedAt,
  };

  return c.json(response, 201);
});

// Update moment
app.patch('/:id', zValidator('json', updateMomentSchema), verifyAuth, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const db = drizzle(c.env.DB);

  // Check if moment exists and belongs to user
  const existing = await db
    .select()
    .from(moments)
    .where(and(eq(moments.id, id), eq(moments.userId, user.id)))
    .limit(1);

  if (!existing[0]) {
    return c.json({ error: 'Moment not found' }, 404);
  }

  const updates: any = {
    updatedAt: new Date(),
  };

  if (data.content !== undefined) {
    updates.content = data.content;
  }

  if (data.tags !== undefined) {
    updates.tags = JSON.stringify(data.tags);
  }

  await db.update(moments).set(updates).where(eq(moments.id, id));

  const updatedMoment = await db
    .select()
    .from(moments)
    .where(eq(moments.id, id))
    .limit(1);

  const response: MomentResponse = {
    id: updatedMoment[0].id,
    userId: updatedMoment[0].userId,
    content: updatedMoment[0].content,
    tags: updatedMoment[0].tags ? JSON.parse(updatedMoment[0].tags) : [],
    createdAt: new Date(updatedMoment[0].createdAt),
    updatedAt: new Date(updatedMoment[0].updatedAt),
  };

  return c.json(response);
});

// Delete moment
app.delete('/:id', verifyAuth, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const db = drizzle(c.env.DB);

  // Check if moment exists and belongs to user
  const existing = await db
    .select()
    .from(moments)
    .where(and(eq(moments.id, id), eq(moments.userId, user.id)))
    .limit(1);

  if (!existing[0]) {
    return c.json({ error: 'Moment not found' }, 404);
  }

  await db.delete(moments).where(eq(moments.id, id));

  return c.json({ success: true });
});

export { app as momentsRouter };