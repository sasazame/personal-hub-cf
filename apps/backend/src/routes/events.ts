import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, between, gte, lte, or, like } from 'drizzle-orm';
import { events, calendarSyncSettings } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { springBootValidator } from '../utils/validation';
import { createValidationError, StatusCodes } from '../utils/spring-boot-compat';
import { createLocalizedError } from '../utils/i18n';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDateTime: z.string(),
  endDateTime: z.string(),
  location: z.string().optional(),
  allDay: z.boolean().optional(),
  reminderMinutes: z.number().optional(),
  color: z.string().optional(),
  googleCalendarId: z.string().optional(),
  googleEventId: z.string().optional(),
});

const updateEventSchema = createEventSchema.partial();

const syncSettingsSchema = z.object({
  googleCalendarId: z.string(),
  calendarName: z.string().optional(),
  syncEnabled: z.boolean().optional(),
  syncDirection: z.string().optional(),
  autoSync: z.boolean().optional(),
  syncInterval: z.number().optional(),
});

// GET /events
app.get('/', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const fromDate = c.req.query('fromDate');
  const toDate = c.req.query('toDate');
  const search = c.req.query('search');
  
  try {
    const conditions = [eq(events.userId, userId as string)];
    
    // Date range filter
    if (fromDate && toDate) {
      const dateCondition = or(
        between(events.startDateTime, fromDate, toDate),
        between(events.endDateTime, fromDate, toDate),
        and(
          lte(events.startDateTime, fromDate),
          gte(events.endDateTime, toDate)
        )
      );
      if (dateCondition) {
        conditions.push(dateCondition);
      }
    } else if (fromDate) {
      conditions.push(gte(events.endDateTime, fromDate));
    } else if (toDate) {
      conditions.push(lte(events.startDateTime, toDate));
    }
    
    // Search filter
    if (search) {
      const searchCondition = or(
        like(events.title, `%${search}%`),
        like(events.description, `%${search}%`),
        like(events.location, `%${search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
    
    const items = await db.select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.startDateTime);
    
    return c.json(items);
  } catch (error) {
    console.error('Get events error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// GET /events/range
app.get('/range', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const fromDate = c.req.query('fromDate') || c.req.query('start');
  const toDate = c.req.query('toDate') || c.req.query('end');
  
  try {
    const conditions = [eq(events.userId, userId as string)];
    
    // Date range filter
    if (fromDate && toDate) {
      conditions.push(
        between(events.startDateTime, new Date(fromDate).toISOString(), new Date(toDate).toISOString())
      );
    } else if (fromDate) {
      conditions.push(gte(events.startDateTime, new Date(fromDate).toISOString()));
    } else if (toDate) {
      conditions.push(lte(events.endDateTime, new Date(toDate).toISOString()));
    }
    
    const items = await db.select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.startDateTime);
    
    return c.json(items);
  } catch (error) {
    console.error('Get events range error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// GET /events/:id
app.get('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const id = parseInt(c.req.param('id'));
  
  try {
    const event = await db.select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId as string)))
      .get();
    
    if (!event) {
      return c.json(
        createLocalizedError('NOT_FOUND', c, { detail: 'Event not found' }),
        404 as ContentfulStatusCode
      );
    }
    
    return c.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// POST /events
app.post('/', zValidator('json', createEventSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const data = c.req.valid('json');
  
  try {
    // Validate end time is after start time
    if (new Date(data.endDateTime) <= new Date(data.startDateTime)) {
      return c.json(
        createValidationError({ endDateTime: 'End time must be after start time' }),
        400
      );
    }
    
    const newEvent = {
      ...data,
      userId,
      allDay: data.allDay ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const result = await db.insert(events).values(newEvent).returning();
    
    return c.json(result[0], StatusCodes.CREATED as ContentfulStatusCode as ContentfulStatusCode);
  } catch (error) {
    console.error('Create event error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /events/:id
app.put('/:id', zValidator('json', updateEventSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  
  try {
    const existing = await db.select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId as string)))
      .get();
    
    if (!existing) {
      return c.json(
        createLocalizedError('NOT_FOUND', c, { detail: 'Event not found' }),
        404 as ContentfulStatusCode
      );
    }
    
    // Validate times if both are provided
    if (data.startDateTime && data.endDateTime) {
      if (new Date(data.endDateTime) <= new Date(data.startDateTime)) {
        return c.json(
          createValidationError({ endDateTime: 'End time must be after start time' }),
          400
        );
      }
    }
    
    const result = await db.update(events)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(events.id, id), eq(events.userId, userId as string)))
      .returning();
    
    return c.json(result[0]);
  } catch (error) {
    console.error('Update event error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// DELETE /events/:id
app.delete('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const id = parseInt(c.req.param('id'));
  
  try {
    const existing = await db.select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId as string)))
      .get();
    
    if (!existing) {
      return c.json(
        createLocalizedError('NOT_FOUND', c, { detail: 'Event not found' }),
        404 as ContentfulStatusCode
      );
    }
    
    await db.delete(events)
      .where(and(eq(events.id, id), eq(events.userId, userId as string)));
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete event error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// GET /events/sync/settings
app.get('/sync/settings', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  
  try {
    const settings = await db.select()
      .from(calendarSyncSettings)
      .where(eq(calendarSyncSettings.userId, userId as string));
    
    return c.json(settings);
  } catch (error) {
    console.error('Get sync settings error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// POST /events/sync/settings
app.post('/sync/settings', zValidator('json', syncSettingsSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const data = c.req.valid('json');
  
  try {
    // Check if settings already exist for this calendar
    const existing = await db.select()
      .from(calendarSyncSettings)
      .where(and(
        eq(calendarSyncSettings.userId, userId as string),
        eq(calendarSyncSettings.googleCalendarId, data.googleCalendarId)
      ))
      .get();
    
    if (existing) {
      return c.json(
        createLocalizedError('CONFLICT', c, { detail: 'Settings already exist for this calendar' }),
        StatusCodes.CONFLICT as ContentfulStatusCode as ContentfulStatusCode
      );
    }
    
    const newSettings = {
      ...data,
      userId,
      syncEnabled: data.syncEnabled ?? true,
      syncDirection: data.syncDirection ?? 'BIDIRECTIONAL',
      autoSync: data.autoSync ?? true,
      syncInterval: data.syncInterval ?? 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const result = await db.insert(calendarSyncSettings).values(newSettings).returning();
    
    return c.json(result[0], StatusCodes.CREATED as ContentfulStatusCode as ContentfulStatusCode);
  } catch (error) {
    console.error('Create sync settings error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /events/sync/settings/:id
app.put('/sync/settings/:id', zValidator('json', syncSettingsSchema.partial(), springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  
  try {
    const result = await db.update(calendarSyncSettings)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(and(
        eq(calendarSyncSettings.id, id),
        eq(calendarSyncSettings.userId, userId as string)
      ))
      .returning();
    
    if (!result.length) {
      return c.json(
        createLocalizedError('NOT_FOUND', c, { detail: 'Settings not found' }),
        404
      );
    }
    
    return c.json(result[0]);
  } catch (error) {
    console.error('Update sync settings error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// DELETE /events/sync/settings/:id
app.delete('/sync/settings/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const id = parseInt(c.req.param('id'));
  
  try {
    const result = await db.delete(calendarSyncSettings)
      .where(and(
        eq(calendarSyncSettings.id, id),
        eq(calendarSyncSettings.userId, userId as string)
      ))
      .returning();
    
    if (!result.length) {
      return c.json(
        createLocalizedError('NOT_FOUND', c, { detail: 'Settings not found' }),
        404
      );
    }
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete sync settings error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// POST /events/sync
app.post('/sync', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId') as string;
  const calendarId = c.req.query('calendarId');
  
  try {
    // Get sync settings
    const settings = await db.select()
      .from(calendarSyncSettings)
      .where(and(
        eq(calendarSyncSettings.userId, userId as string),
        calendarId ? eq(calendarSyncSettings.googleCalendarId, calendarId) : undefined
      ));
    
    if (!settings.length) {
      return c.json(
        createLocalizedError('NOT_FOUND', c, { detail: 'No sync settings found' }),
        404
      );
    }
    
    // TODO: Implement actual sync logic with Google Calendar API
    // For now, just update last sync time
    const now = new Date().toISOString();
    
    for (const setting of settings) {
      if (setting.syncEnabled) {
        await db.update(calendarSyncSettings)
          .set({ lastSyncAt: now })
          .where(eq(calendarSyncSettings.id, setting.id));
      }
    }
    
    return c.json({ 
      message: 'Sync completed',
      syncedCalendars: settings.filter(s => s.syncEnabled).length,
      timestamp: now
    });
  } catch (error) {
    console.error('Sync error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

export default app;