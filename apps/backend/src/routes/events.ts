import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, between, gte, lte, or, like } from 'drizzle-orm';
import { events, calendarSyncSettings } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { springBootValidator } from '../utils/validation';
import { createErrorResponse, createValidationError, ErrorCodes, StatusCodes } from '../utils/spring-boot-compat';

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
  const userId = c.get('userId');
  const fromDate = c.req.query('fromDate');
  const toDate = c.req.query('toDate');
  const search = c.req.query('search');
  
  try {
    const conditions = [eq(events.userId, userId)];
    
    // Date range filter
    if (fromDate && toDate) {
      conditions.push(
        or(
          between(events.startDateTime, fromDate, toDate),
          between(events.endDateTime, fromDate, toDate),
          and(
            lte(events.startDateTime, fromDate),
            gte(events.endDateTime, toDate)
          )
        )
      );
    } else if (fromDate) {
      conditions.push(gte(events.endDateTime, fromDate));
    } else if (toDate) {
      conditions.push(lte(events.startDateTime, toDate));
    }
    
    // Search filter
    if (search) {
      conditions.push(
        or(
          like(events.title, `%${search}%`),
          like(events.description, `%${search}%`),
          like(events.location, `%${search}%`)
        )
      );
    }
    
    const items = await db.select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.startDateTime);
    
    return c.json(items);
  } catch (error) {
    console.error('Get events error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// GET /events/range
app.get('/range', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const fromDate = c.req.query('fromDate') || c.req.query('start');
  const toDate = c.req.query('toDate') || c.req.query('end');
  
  try {
    const conditions = [eq(events.userId, userId)];
    
    // Date range filter
    if (fromDate && toDate) {
      conditions.push(
        between(events.startDateTime, new Date(fromDate), new Date(toDate))
      );
    } else if (fromDate) {
      conditions.push(gte(events.startDateTime, new Date(fromDate)));
    } else if (toDate) {
      conditions.push(lte(events.endDateTime, new Date(toDate)));
    }
    
    const items = await db.select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.startDateTime);
    
    return c.json(items);
  } catch (error) {
    console.error('Get events range error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// GET /events/:id
app.get('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  try {
    const event = await db.select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .get();
    
    if (!event) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Event not found'),
        StatusCodes.NOT_FOUND
      );
    }
    
    return c.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// POST /events
app.post('/', zValidator('json', createEventSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const data = c.req.valid('json');
  
  try {
    // Validate end time is after start time
    if (new Date(data.endDateTime) <= new Date(data.startDateTime)) {
      return c.json(
        createValidationError({ endDateTime: 'End time must be after start time' }),
        StatusCodes.VALIDATION_ERROR
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
    
    return c.json(result[0], 201);
  } catch (error) {
    console.error('Create event error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// PUT /events/:id
app.put('/:id', zValidator('json', updateEventSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  
  try {
    const existing = await db.select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .get();
    
    if (!existing) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Event not found'),
        StatusCodes.NOT_FOUND
      );
    }
    
    // Validate times if both are provided
    if (data.startDateTime && data.endDateTime) {
      if (new Date(data.endDateTime) <= new Date(data.startDateTime)) {
        return c.json(
          createValidationError({ endDateTime: 'End time must be after start time' }),
          StatusCodes.VALIDATION_ERROR
        );
      }
    }
    
    const result = await db.update(events)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .returning();
    
    return c.json(result[0]);
  } catch (error) {
    console.error('Update event error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// DELETE /events/:id
app.delete('/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  try {
    const existing = await db.select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .get();
    
    if (!existing) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Event not found'),
        StatusCodes.NOT_FOUND
      );
    }
    
    await db.delete(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)));
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete event error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// GET /events/sync/settings
app.get('/sync/settings', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  
  try {
    const settings = await db.select()
      .from(calendarSyncSettings)
      .where(eq(calendarSyncSettings.userId, userId));
    
    return c.json(settings);
  } catch (error) {
    console.error('Get sync settings error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// POST /events/sync/settings
app.post('/sync/settings', zValidator('json', syncSettingsSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const data = c.req.valid('json');
  
  try {
    // Check if settings already exist for this calendar
    const existing = await db.select()
      .from(calendarSyncSettings)
      .where(and(
        eq(calendarSyncSettings.userId, userId),
        eq(calendarSyncSettings.googleCalendarId, data.googleCalendarId)
      ))
      .get();
    
    if (existing) {
      return c.json(
        createErrorResponse(ErrorCodes.CONFLICT, 'Settings already exist for this calendar'),
        StatusCodes.CONFLICT
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
    
    return c.json(result[0], 201);
  } catch (error) {
    console.error('Create sync settings error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// PUT /events/sync/settings/:id
app.put('/sync/settings/:id', zValidator('json', syncSettingsSchema.partial(), springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
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
        eq(calendarSyncSettings.userId, userId)
      ))
      .returning();
    
    if (!result.length) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Settings not found'),
        StatusCodes.NOT_FOUND
      );
    }
    
    return c.json(result[0]);
  } catch (error) {
    console.error('Update sync settings error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// DELETE /events/sync/settings/:id
app.delete('/sync/settings/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  try {
    const result = await db.delete(calendarSyncSettings)
      .where(and(
        eq(calendarSyncSettings.id, id),
        eq(calendarSyncSettings.userId, userId)
      ))
      .returning();
    
    if (!result.length) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Settings not found'),
        StatusCodes.NOT_FOUND
      );
    }
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete sync settings error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

// POST /events/sync
app.post('/sync', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const calendarId = c.req.query('calendarId');
  
  try {
    // Get sync settings
    const settings = await db.select()
      .from(calendarSyncSettings)
      .where(and(
        eq(calendarSyncSettings.userId, userId),
        calendarId ? eq(calendarSyncSettings.googleCalendarId, calendarId) : undefined
      ));
    
    if (!settings.length) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'No sync settings found'),
        StatusCodes.NOT_FOUND
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
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      StatusCodes.INTERNAL_ERROR
    );
  }
});

export default app;