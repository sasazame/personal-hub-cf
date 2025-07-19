import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, desc, eq, gte, lte, or, like } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { 
  todoExportQuerySchema,
  goalExportQuerySchema,
  eventExportQuerySchema,
  noteExportQuerySchema,
  momentExportQuerySchema,
  pomodoroExportQuerySchema,
  type JsonExportResponse
} from '@personal-hub/shared';
import {
  todos,
  goals,
  events,
  notes,
  moments,
  pomodoroSessions,
} from '@personal-hub/shared';
import type { AuthEnv } from '../types';
import { requireAuth } from '../middleware/auth';
import { serializeTodos } from '../helpers/todo-serializer';
import { serializeGoals } from '../helpers/goals-serializer';
import { createExportMetadata, objectsToCSV, setDownloadHeaders } from '../helpers/export';

const exportRouter = new Hono<AuthEnv>();

// Apply auth middleware to all routes
exportRouter.use('*', requireAuth);

// Export todos
exportRouter.get('/todos', zValidator('query', todoExportQuerySchema), async (c) => {
  const user = c.get('user');
  const query = c.req.valid('query');
  const db = drizzle(c.env.DB);

  try {
    // Build conditions
    const conditions = [eq(todos.userId, user.id)];
    
    if (query.status) {
      conditions.push(eq(todos.status, query.status));
    }
    
    if (query.priority) {
      conditions.push(eq(todos.priority, query.priority));
    }
    
    if (query.dateFrom) {
      conditions.push(gte(todos.createdAt, new Date(query.dateFrom)));
    }
    
    if (query.dateTo) {
      conditions.push(lte(todos.createdAt, new Date(query.dateTo)));
    }

    // Fetch todos
    const todoRecords = await db
      .select()
      .from(todos)
      .where(and(...conditions))
      .orderBy(desc(todos.createdAt))
      .all();

    const serializedTodos = serializeTodos(todoRecords);
    const metadata = createExportMetadata(serializedTodos.length, query);

    // Generate response based on format
    if (query.format === 'csv') {
      const csv = objectsToCSV(serializedTodos as unknown as Record<string, unknown>[], [
        'id', 'title', 'description', 'status', 'priority', 
        'dueDate', 'createdAt', 'updatedAt'
      ]);
      
      const filename = `todos-export-${new Date().toISOString().split('T')[0]}.csv`;
      setDownloadHeaders(c, filename, 'csv');
      
      return c.text(csv);
    } else {
      const response: JsonExportResponse<typeof serializedTodos[0]> = {
        metadata,
        data: serializedTodos,
      };
      
      const filename = `todos-export-${new Date().toISOString().split('T')[0]}.json`;
      setDownloadHeaders(c, filename, 'json');
      
      return c.json(response);
    }
  } catch (error) {
    console.error('Export todos error:', error);
    return c.json({ error: 'Failed to export todos' }, 500);
  }
});

// Export goals
exportRouter.get('/goals', zValidator('query', goalExportQuerySchema), async (c) => {
  const user = c.get('user');
  const query = c.req.valid('query');
  const db = drizzle(c.env.DB);

  try {
    // Build conditions
    const conditions = [eq(goals.userId, user.id)];
    
    if (query.status) {
      conditions.push(eq(goals.status, query.status));
    }
    
    if (query.type) {
      conditions.push(eq(goals.type, query.type));
    }
    
    if (query.dateFrom) {
      conditions.push(gte(goals.createdAt, new Date(query.dateFrom)));
    }
    
    if (query.dateTo) {
      conditions.push(lte(goals.createdAt, new Date(query.dateTo)));
    }

    // Fetch goals
    const goalRecords = await db
      .select()
      .from(goals)
      .where(and(...conditions))
      .orderBy(desc(goals.createdAt))
      .all();

    const serializedGoals = serializeGoals(goalRecords);
    const metadata = createExportMetadata(serializedGoals.length, query);

    // Generate response based on format
    if (query.format === 'csv') {
      const csv = objectsToCSV(serializedGoals as unknown as Record<string, unknown>[], [
        'id', 'title', 'description', 'type', 'status',
        'targetValue', 'currentValue', 'unit', 'startDate', 
        'endDate', 'createdAt', 'updatedAt'
      ]);
      
      const filename = `goals-export-${new Date().toISOString().split('T')[0]}.csv`;
      setDownloadHeaders(c, filename, 'csv');
      
      return c.text(csv);
    } else {
      const response: JsonExportResponse<typeof serializedGoals[0]> = {
        metadata,
        data: serializedGoals,
      };
      
      const filename = `goals-export-${new Date().toISOString().split('T')[0]}.json`;
      setDownloadHeaders(c, filename, 'json');
      
      return c.json(response);
    }
  } catch (error) {
    console.error('Export goals error:', error);
    return c.json({ error: 'Failed to export goals' }, 500);
  }
});

// Export events
exportRouter.get('/events', zValidator('query', eventExportQuerySchema), async (c) => {
  const user = c.get('user');
  const query = c.req.valid('query');
  const db = drizzle(c.env.DB);

  try {
    // Build conditions
    const conditions = [eq(events.userId, user.id)];
    
    if (query.allDay !== undefined) {
      conditions.push(eq(events.allDay, query.allDay));
    }
    
    if (query.dateFrom) {
      conditions.push(gte(events.startDateTime, new Date(query.dateFrom)));
    }
    
    if (query.dateTo) {
      conditions.push(lte(events.startDateTime, new Date(query.dateTo)));
    }

    // Fetch events
    const eventRecords = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(desc(events.startDateTime))
      .all();

    const metadata = createExportMetadata(eventRecords.length, query);

    // Transform events for export
    interface EventRecord {
      id: string;
      title: string;
      description: string | null;
      startDateTime: Date;
      endDateTime: Date;
      allDay: boolean;
      location: string | null;
      reminderMinutes: number | null;
      createdAt: Date;
      updatedAt: Date;
    }
    
    const exportEvents = eventRecords.map((event: EventRecord) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDateTime.toISOString(),
      endDate: event.endDateTime.toISOString(),
      allDay: event.allDay,
      location: event.location,
      reminder: event.reminderMinutes?.toString() || null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }));

    // Generate response based on format
    if (query.format === 'csv') {
      const csv = objectsToCSV(exportEvents, [
        'id', 'title', 'description', 'startDate', 'endDate',
        'allDay', 'location', 'reminder', 'createdAt', 'updatedAt'
      ]);
      
      const filename = `events-export-${new Date().toISOString().split('T')[0]}.csv`;
      setDownloadHeaders(c, filename, 'csv');
      
      return c.text(csv);
    } else {
      const response: JsonExportResponse<typeof exportEvents[0]> = {
        metadata,
        data: exportEvents,
      };
      
      const filename = `events-export-${new Date().toISOString().split('T')[0]}.json`;
      setDownloadHeaders(c, filename, 'json');
      
      return c.json(response);
    }
  } catch (error) {
    console.error('Export events error:', error);
    return c.json({ error: 'Failed to export events' }, 500);
  }
});

// Export notes
exportRouter.get('/notes', zValidator('query', noteExportQuerySchema), async (c) => {
  const user = c.get('user');
  const query = c.req.valid('query');
  const db = drizzle(c.env.DB);

  try {
    // Build conditions
    const conditions = [eq(notes.userId, user.id)];
    
    if (query.tags) {
      const tagList = query.tags.split(',').map(t => t.trim());
      // Check if any of the tags are in the note's tags array
      const tagConditions = tagList.map(tag => 
        like(notes.tags, `%${tag.replace(/[%_\\]/g, '\\$&')}%`)
      );
      if (tagConditions.length > 0) {
        conditions.push(or(...tagConditions)!);
      }
    }
    
    if (query.dateFrom) {
      conditions.push(gte(notes.createdAt, new Date(query.dateFrom)));
    }
    
    if (query.dateTo) {
      conditions.push(lte(notes.createdAt, new Date(query.dateTo)));
    }

    // Fetch notes
    const noteRecords = await db
      .select()
      .from(notes)
      .where(and(...conditions))
      .orderBy(desc(notes.createdAt))
      .all();

    const metadata = createExportMetadata(noteRecords.length, query);

    // Transform notes for export
    interface NoteRecord {
      id: string;
      title: string;
      content: string | null;
      tags: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
    
    const exportNotes = noteRecords.map((note: NoteRecord) => ({
      id: note.id,
      title: note.title,
      content: note.content || '',
      tags: note.tags,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    }));

    // Generate response based on format
    if (query.format === 'csv') {
      const csv = objectsToCSV(exportNotes, [
        'id', 'title', 'content', 'tags', 'createdAt', 'updatedAt'
      ]);
      
      const filename = `notes-export-${new Date().toISOString().split('T')[0]}.csv`;
      setDownloadHeaders(c, filename, 'csv');
      
      return c.text(csv);
    } else {
      const response: JsonExportResponse<typeof exportNotes[0]> = {
        metadata,
        data: exportNotes,
      };
      
      const filename = `notes-export-${new Date().toISOString().split('T')[0]}.json`;
      setDownloadHeaders(c, filename, 'json');
      
      return c.json(response);
    }
  } catch (error) {
    console.error('Export notes error:', error);
    return c.json({ error: 'Failed to export notes' }, 500);
  }
});

// Export moments
exportRouter.get('/moments', zValidator('query', momentExportQuerySchema), async (c) => {
  const user = c.get('user');
  const query = c.req.valid('query');
  const db = drizzle(c.env.DB);

  try {
    // Build conditions
    const conditions = [eq(moments.userId, user.id)];
    
    if (query.tags) {
      const tagList = query.tags.split(',').map(t => t.trim());
      const tagConditions = tagList.map(tag => 
        like(moments.tags, `%${tag.replace(/[%_\\]/g, '\\$&')}%`)
      );
      if (tagConditions.length > 0) {
        conditions.push(or(...tagConditions)!);
      }
    }
    
    if (query.dateFrom) {
      conditions.push(gte(moments.createdAt, new Date(query.dateFrom)));
    }
    
    if (query.dateTo) {
      conditions.push(lte(moments.createdAt, new Date(query.dateTo)));
    }

    // Fetch moments
    const momentRecords = await db
      .select()
      .from(moments)
      .where(and(...conditions))
      .orderBy(desc(moments.createdAt))
      .all();

    const metadata = createExportMetadata(momentRecords.length, query);

    // Transform moments for export
    interface MomentRecord {
      id: string;
      content: string;
      tags: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
    
    const exportMoments = momentRecords.map((moment: MomentRecord) => ({
      id: moment.id,
      content: moment.content,
      tags: moment.tags,
      createdAt: moment.createdAt.toISOString(),
      updatedAt: moment.updatedAt.toISOString(),
    }));

    // Generate response based on format
    if (query.format === 'csv') {
      const csv = objectsToCSV(exportMoments, [
        'id', 'content', 'tags', 'createdAt', 'updatedAt'
      ]);
      
      const filename = `moments-export-${new Date().toISOString().split('T')[0]}.csv`;
      setDownloadHeaders(c, filename, 'csv');
      
      return c.text(csv);
    } else {
      const response: JsonExportResponse<typeof exportMoments[0]> = {
        metadata,
        data: exportMoments,
      };
      
      const filename = `moments-export-${new Date().toISOString().split('T')[0]}.json`;
      setDownloadHeaders(c, filename, 'json');
      
      return c.json(response);
    }
  } catch (error) {
    console.error('Export moments error:', error);
    return c.json({ error: 'Failed to export moments' }, 500);
  }
});

// Export pomodoro sessions
exportRouter.get('/pomodoro', zValidator('query', pomodoroExportQuerySchema), async (c) => {
  const user = c.get('user');
  const query = c.req.valid('query');
  const db = drizzle(c.env.DB);

  try {
    // Build conditions
    const conditions = [eq(pomodoroSessions.userId, user.id)];
    
    if (query.sessionType) {
      conditions.push(eq(pomodoroSessions.sessionType, query.sessionType));
    }
    
    if (query.completed !== undefined) {
      conditions.push(eq(pomodoroSessions.completed, query.completed));
    }
    
    if (query.dateFrom) {
      conditions.push(gte(pomodoroSessions.startTime, new Date(query.dateFrom)));
    }
    
    if (query.dateTo) {
      conditions.push(lte(pomodoroSessions.startTime, new Date(query.dateTo)));
    }

    // Fetch sessions
    const sessionRecords = await db
      .select()
      .from(pomodoroSessions)
      .where(and(...conditions))
      .orderBy(desc(pomodoroSessions.startTime))
      .all();

    const metadata = createExportMetadata(sessionRecords.length, query);

    // Transform sessions for export
    interface PomodoroSessionRecord {
      id: string;
      sessionType: string;
      duration: number;
      startTime: Date;
      endTime: Date | null;
      completed: boolean;
      createdAt: Date;
    }
    
    const exportSessions = sessionRecords.map((session: PomodoroSessionRecord) => ({
      id: session.id,
      type: session.sessionType,
      duration: session.duration,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString() || null,
      completed: session.completed,
      createdAt: session.createdAt.toISOString(),
    }));

    // Generate response based on format
    if (query.format === 'csv') {
      const csv = objectsToCSV(exportSessions, [
        'id', 'type', 'duration', 'startTime', 'endTime',
        'completed', 'createdAt'
      ]);
      
      const filename = `pomodoro-export-${new Date().toISOString().split('T')[0]}.csv`;
      setDownloadHeaders(c, filename, 'csv');
      
      return c.text(csv);
    } else {
      const response: JsonExportResponse<typeof exportSessions[0]> = {
        metadata,
        data: exportSessions,
      };
      
      const filename = `pomodoro-export-${new Date().toISOString().split('T')[0]}.json`;
      setDownloadHeaders(c, filename, 'json');
      
      return c.json(response);
    }
  } catch (error) {
    console.error('Export pomodoro error:', error);
    return c.json({ error: 'Failed to export pomodoro sessions' }, 500);
  }
});

export { exportRouter };