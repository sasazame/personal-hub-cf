import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, or, gte, lte, like, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import {
  events,
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
  eventToResponse,
  requestToNewEvent,
  type EventsListResponse,
} from '@personal-hub/shared';
import type { AuthEnv } from '../types';
import { requireAuth } from '../middleware/auth';

const app = new Hono<AuthEnv>();

// List events with filtering and pagination
app.get('/', requireAuth, zValidator('query', listEventsQuerySchema), async (c) => {
  const user = c.get('user');
  const query = c.req.valid('query');
  const db = drizzle(c.env.DB);

  // Build query conditions
  const conditions = [eq(events.userId, user.id)];

  if (query.startDate) {
    conditions.push(gte(events.endDateTime, new Date(query.startDate)));
  }

  if (query.endDate) {
    conditions.push(lte(events.startDateTime, new Date(query.endDate)));
  }

  if (query.search) {
    const searchCondition = or(
      like(events.title, `%${query.search}%`),
      like(events.description, `%${query.search}%`),
      like(events.location, `%${query.search}%`)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(events)
    .where(and(...conditions));

  // Get paginated events
  const eventsList = await db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(events.startDateTime)
    .limit(query.limit)
    .offset(query.offset);

  const response: EventsListResponse = {
    events: eventsList.map(eventToResponse),
    total: count,
    limit: query.limit,
    offset: query.offset,
  };

  return c.json(response);
});

// Get single event
app.get('/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const eventId = c.req.param('id');
  const db = drizzle(c.env.DB);

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.userId, user.id)));

  if (!event) {
    return c.json({ error: 'Event not found' }, 404);
  }

  return c.json(eventToResponse(event));
});

// Create event
app.post('/', requireAuth, zValidator('json', createEventSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');
  const db = drizzle(c.env.DB);

  // Validate date range
  const startDate = new Date(data.startDateTime);
  const endDate = new Date(data.endDateTime);
  
  if (startDate >= endDate) {
    return c.json({ error: 'End date must be after start date' }, 400);
  }

  const newEvent = requestToNewEvent(data, user.id);
  
  const [createdEvent] = await db
    .insert(events)
    .values(newEvent)
    .returning();

  return c.json(eventToResponse(createdEvent), 201);
});

// Update event
app.put('/:id', requireAuth, zValidator('json', updateEventSchema), async (c) => {
  const user = c.get('user');
  const eventId = c.req.param('id');
  const updates = c.req.valid('json');
  const db = drizzle(c.env.DB);

  // Check if event exists and belongs to user
  const [existingEvent] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.userId, user.id)));

  if (!existingEvent) {
    return c.json({ error: 'Event not found' }, 404);
  }

  // Validate date range if dates are being updated
  if (updates.startDateTime || updates.endDateTime) {
    const startDate = new Date(updates.startDateTime || existingEvent.startDateTime);
    const endDate = new Date(updates.endDateTime || existingEvent.endDateTime);
    
    if (startDate >= endDate) {
      return c.json({ error: 'End date must be after start date' }, 400);
    }
  }

  const updateData: any = {
    ...updates,
    updatedAt: new Date(),
  };

  // Convert datetime strings to Date objects
  if (updates.startDateTime) {
    updateData.startDateTime = new Date(updates.startDateTime);
  }
  if (updates.endDateTime) {
    updateData.endDateTime = new Date(updates.endDateTime);
  }

  const [updatedEvent] = await db
    .update(events)
    .set(updateData)
    .where(and(eq(events.id, eventId), eq(events.userId, user.id)))
    .returning();

  return c.json(eventToResponse(updatedEvent));
});

// Delete event
app.delete('/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const eventId = c.req.param('id');
  const db = drizzle(c.env.DB);

  // Check if event exists and belongs to user
  const [existingEvent] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.userId, user.id)));

  if (!existingEvent) {
    return c.json({ error: 'Event not found' }, 404);
  }

  await db
    .delete(events)
    .where(and(eq(events.id, eventId), eq(events.userId, user.id)));

  return c.json({ message: 'Event deleted successfully' });
});

export default app;