import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../middleware/auth';
import { searchRequestSchema, type SearchResultItem, type SearchResponse } from '@personal-hub/shared';
import { todos, goals, events, notes, moments } from '@personal-hub/shared';
import { eq, and, or, like } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import type { AuthEnv } from '../types';

const app = new Hono<AuthEnv>();

app.get('/', requireAuth, zValidator('query', searchRequestSchema), async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const user = c.get('user');
    const query = c.req.valid('query');
    const searchTerm = `%${query.query}%`;
    
    const typesToSearch = query.types || ['todos', 'goals', 'events', 'notes', 'moments'];
    const results: SearchResultItem[] = [];
    
    const limit = query.limit;
    const offset = query.offset;
    
    // Search todos
    if (typesToSearch.includes('todos')) {
      const todoResults = await db
        .select()
        .from(todos)
        .where(
          and(
            eq(todos.userId, user.id),
            or(
              like(todos.title, searchTerm),
              like(todos.description, searchTerm)
            )
          )
        )
        .limit(limit)
        .offset(offset);
      
      for (const todo of todoResults) {
        results.push({
          id: todo.id,
          type: 'todos',
          title: todo.title,
          content: todo.description ? todo.description : undefined,
          status: todo.status,
          priority: todo.priority ? todo.priority : undefined,
          tags: undefined, // todos don't have tags in schema
          url: `/todos/${todo.id}`,
          createdAt: todo.createdAt.toISOString(),
          updatedAt: todo.updatedAt.toISOString(),
        });
      }
    }
    
    // Search goals
    if (typesToSearch.includes('goals')) {
      const goalResults = await db
        .select()
        .from(goals)
        .where(
          and(
            eq(goals.userId, user.id),
            or(
              like(goals.title, searchTerm),
              like(goals.description, searchTerm)
            )
          )
        )
        .limit(limit)
        .offset(offset);
      
      for (const goal of goalResults) {
        results.push({
          id: goal.id,
          type: 'goals',
          title: goal.title,
          content: goal.description || undefined,
          status: goal.status,
          url: `/goals/${goal.id}`,
          createdAt: goal.createdAt.toISOString(),
          updatedAt: goal.updatedAt.toISOString(),
        });
      }
    }
    
    // Search events
    if (typesToSearch.includes('events')) {
      const eventResults = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.userId, user.id),
            or(
              like(events.title, searchTerm),
              like(events.description, searchTerm),
              like(events.location, searchTerm)
            )
          )
        )
        .limit(limit)
        .offset(offset);
      
      for (const event of eventResults) {
        results.push({
          id: event.id,
          type: 'events',
          title: event.title,
          content: event.description || undefined,
          date: event.startDateTime.toISOString(),
          url: `/events/${event.id}`,
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.updatedAt.toISOString(),
        });
      }
    }
    
    // Search notes
    if (typesToSearch.includes('notes')) {
      const noteResults = await db
        .select()
        .from(notes)
        .where(
          and(
            eq(notes.userId, user.id),
            or(
              like(notes.title, searchTerm),
              like(notes.content, searchTerm)
            )
          )
        )
        .limit(limit)
        .offset(offset);
      
      for (const note of noteResults) {
        const noteTags = note.tags ? (typeof note.tags === 'string' ? JSON.parse(note.tags) : note.tags) : undefined;
        results.push({
          id: note.id,
          type: 'notes',
          title: note.title,
          content: note.content ? note.content.substring(0, 200) + (note.content.length > 200 ? '...' : '') : undefined,
          tags: noteTags,
          url: `/notes/${note.id}`,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        });
      }
    }
    
    // Search moments
    if (typesToSearch.includes('moments')) {
      const momentResults = await db
        .select()
        .from(moments)
        .where(
          and(
            eq(moments.userId, user.id),
            like(moments.content, searchTerm)
          )
        )
        .limit(limit)
        .offset(offset);
      
      for (const moment of momentResults) {
        const momentTags = moment.tags ? (typeof moment.tags === 'string' ? JSON.parse(moment.tags) : moment.tags) : undefined;
        results.push({
          id: moment.id,
          type: 'moments',
          title: moment.content.substring(0, 50) + (moment.content.length > 50 ? '...' : ''),
          content: moment.content,
          tags: momentTags,
          url: `/moments/${moment.id}`,
          createdAt: moment.createdAt.toISOString(),
          updatedAt: moment.updatedAt.toISOString(),
        });
      }
    }
    
    // Sort results by relevance (for now, by updatedAt descending)
    results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    // Apply pagination to the combined results
    const paginatedResults = results.slice(0, limit);
    
    const response: SearchResponse = {
      results: paginatedResults,
      total: results.length,
      limit,
      offset,
      query: query.query,
      types: typesToSearch,
    };
    
    return c.json(response);
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Failed to perform search' }, 500);
  }
});

export default app;