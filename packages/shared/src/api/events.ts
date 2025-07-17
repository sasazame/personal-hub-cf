import { z } from 'zod';
import type { Event, NewEvent } from '../db/schema';

// Base event schema
export const eventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().nullable(),
  startDateTime: z.string().datetime(), // ISO string
  endDateTime: z.string().datetime(), // ISO string
  location: z.string().nullable(),
  allDay: z.boolean().default(false),
  reminderMinutes: z.number().nullable(),
  color: z.string().nullable(),
  googleEventId: z.string().nullable(),
});

// Create event request
export const createEventSchema = eventSchema.omit({ googleEventId: true });
export type CreateEventRequest = z.infer<typeof createEventSchema>;

// Update event request
export const updateEventSchema = eventSchema.partial();
export type UpdateEventRequest = z.infer<typeof updateEventSchema>;

// List events query params
export const listEventsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

// Event response types
export interface EventResponse extends Omit<Event, 'startDateTime' | 'endDateTime'> {
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
}

export interface EventsListResponse {
  events: EventResponse[];
  total: number;
  limit: number;
  offset: number;
}

// Utility functions for date conversion
export function eventToResponse(event: Event): EventResponse {
  return {
    ...event,
    startDateTime: new Date(event.startDateTime).toISOString(),
    endDateTime: new Date(event.endDateTime).toISOString(),
  };
}

export function requestToNewEvent(
  request: CreateEventRequest,
  userId: string
): Omit<NewEvent, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId,
    title: request.title,
    description: request.description,
    startDateTime: new Date(request.startDateTime),
    endDateTime: new Date(request.endDateTime),
    location: request.location,
    allDay: request.allDay,
    reminderMinutes: request.reminderMinutes,
    color: request.color,
    googleEventId: null,
  };
}