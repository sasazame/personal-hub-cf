import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, or, like, between, gte, lte, isNotNull } from 'drizzle-orm';
import { moments } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { springBootValidator } from '../utils/validation';
import { createErrorResponse, ErrorCodes, StatusCodes } from '../utils/spring-boot-compat';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Validation schemas
const createMomentSchema = z.object({
  content: z.string().min(1),
  tags: z.string().optional(),
});

const updateMomentSchema = createMomentSchema;

// GET /moments
app.get('/', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const search = c.req.query('search');
  const tags = c.req.query('tags');
  const fromDate = c.req.query('fromDate');
  const toDate = c.req.query('toDate');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  try {
    const conditions = [eq(moments.userId, userId)];
    
    // Search filter
    if (search) {
      conditions.push(like(moments.content, `%${search}%`));
    }
    
    // Tags filter
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim());
      const tagConditions = tagList.map(tag => 
        like(moments.tags, `%${tag}%`)
      );
      if (tagConditions.length > 0) {
        conditions.push(or(...tagConditions));
      }
    }
    
    // Date range filter
    if (fromDate && toDate) {
      conditions.push(between(moments.createdAt, fromDate, toDate));
    } else if (fromDate) {
      conditions.push(gte(moments.createdAt, fromDate));
    } else if (toDate) {
      conditions.push(lte(moments.createdAt, toDate));
    }
    
    const [items, totalResult] = await Promise.all([
      db.select()
        .from(moments)
        .where(and(...conditions))
        .orderBy(desc(moments.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: moments.id })
        .from(moments)
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
    console.error('Get moments error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// GET /moments/today - MUST BE BEFORE /:id
app.get('/today', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaysMoments = await db.select()
      .from(moments)
      .where(and(
        eq(moments.userId, userId),
        between(moments.createdAt, today.toISOString(), tomorrow.toISOString())
      ))
      .orderBy(desc(moments.createdAt));
    
    return c.json(todaysMoments);
  } catch (error) {
    console.error('Get today moments error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// GET /moments/tags - MUST BE BEFORE /:id
app.get('/tags', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  
  try {
    // Get all moments with tags
    const momentsWithTags = await db.select({ tags: moments.tags })
      .from(moments)
      .where(and(eq(moments.userId, userId), isNotNull(moments.tags)));
    
    // Extract and count unique tags
    const tagCounts: Record<string, number> = {};
    
    momentsWithTags.forEach(moment => {
      if (moment.tags) {
        const tags = moment.tags.split(',').map(t => t.trim()).filter(t => t);
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

// GET /moments/tags/default - Get default tags
app.get('/tags/default', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  
  try {
    // Default tags that are always suggested
    const defaultTags = [
      { tag: 'gratitude', count: 0 },
      { tag: 'achievement', count: 0 },
      { tag: 'reflection', count: 0 },
      { tag: 'learning', count: 0 },
      { tag: 'milestone', count: 0 }
    ];
    
    // Get user's most used tags
    const momentsWithTags = await db.select({ tags: moments.tags })
      .from(moments)
      .where(and(eq(moments.userId, userId), isNotNull(moments.tags)));
    
    const tagCounts: Record<string, number> = {};
    
    momentsWithTags.forEach(moment => {
      if (moment.tags) {
        const tags = moment.tags.split(',').map(t => t.trim()).filter(t => t);
        tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Update counts for default tags if they exist
    defaultTags.forEach(dt => {
      if (tagCounts[dt.tag]) {
        dt.count = tagCounts[dt.tag];
      }
    });
    
    // Add top user tags that aren't in defaults
    const userTags = Object.entries(tagCounts)
      .filter(([tag]) => !defaultTags.find(dt => dt.tag === tag))
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const allTags = [...defaultTags, ...userTags].sort((a, b) => b.count - a.count);
    
    return c.json(allTags);
  } catch (error) {
    console.error('Get default tags error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// GET /moments/stats - MUST BE BEFORE /:id
app.get('/stats', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const days = parseInt(c.req.query('days') || '30');
  
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const allMoments = await db.select()
      .from(moments)
      .where(and(
        eq(moments.userId, userId),
        gte(moments.createdAt, startDate.toISOString())
      ));
    
    // Group by date
    const momentsByDate: Record<string, number> = {};
    
    allMoments.forEach(moment => {
      const date = moment.createdAt.split('T')[0];
      momentsByDate[date] = (momentsByDate[date] || 0) + 1;
    });
    
    // Calculate stats
    const totalMoments = allMoments.length;
    const daysWithMoments = Object.keys(momentsByDate).length;
    const averagePerDay = totalMoments / days;
    const maxPerDay = Math.max(...Object.values(momentsByDate), 0);
    
    return c.json({
      totalMoments,
      daysWithMoments,
      averagePerDay,
      maxPerDay,
      momentsByDate,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// GET /moments/:id
app.get('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  try {
    const moment = await db.select()
      .from(moments)
      .where(and(eq(moments.id, id), eq(moments.userId, userId)))
      .get();
    
    if (!moment) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Moment not found'),
        StatusCodes.NOT_FOUND
      );
    }
    
    return c.json(moment);
  } catch (error) {
    console.error('Get moment error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// POST /moments
app.post('/', zValidator('json', createMomentSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const data = c.req.valid('json');
  
  try {
    const newMoment = {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const result = await db.insert(moments).values(newMoment).returning();
    
    return c.json(result[0], 201);
  } catch (error) {
    console.error('Create moment error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// PUT /moments/:id
app.put('/:id', zValidator('json', updateMomentSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  
  try {
    const existing = await db.select()
      .from(moments)
      .where(and(eq(moments.id, id), eq(moments.userId, userId)))
      .get();
    
    if (!existing) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Moment not found'),
        StatusCodes.NOT_FOUND
      );
    }
    
    const result = await db.update(moments)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(moments.id, id), eq(moments.userId, userId)))
      .returning();
    
    return c.json(result[0]);
  } catch (error) {
    console.error('Update moment error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// DELETE /moments/:id
app.delete('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  try {
    const existing = await db.select()
      .from(moments)
      .where(and(eq(moments.id, id), eq(moments.userId, userId)))
      .get();
    
    if (!existing) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Moment not found'),
        StatusCodes.NOT_FOUND
      );
    }
    
    await db.delete(moments)
      .where(and(eq(moments.id, id), eq(moments.userId, userId)));
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete moment error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

export default app;