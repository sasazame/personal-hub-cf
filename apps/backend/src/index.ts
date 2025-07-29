import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ZodError } from 'zod';
import { createDb } from './db';
import type { Bindings, Variables } from './types';
import authRoutes from './routes/auth';
import todosRoutes from './routes/todos';
import goalsRoutes from './routes/goals';
import pomodoroRoutes from './routes/pomodoro';
import eventsRoutes from './routes/events';
import notesRoutes from './routes/notes';
import momentsRoutes from './routes/moments';
import usersRoutes from './routes/users';
import analyticsRoutes from './routes/analytics';
import { createValidationError, StatusCodes } from './utils/spring-boot-compat';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply CORS middleware
app.use('*', cors({
  origin: (origin) => {
    // Allow requests from localhost during development
    if (!origin || origin.startsWith('http://localhost:')) {
      return origin;
    }
    // In production, allow requests from the deployed frontend
    // This will be updated with actual production URL
    return origin;
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Database middleware
app.use('*', async (c, next) => {
  const db = createDb(c.env.DB);
  c.set('db', db);
  await next();
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', environment: c.env.ENVIRONMENT });
});

// Mount routes
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/todos', todosRoutes);
app.route('/api/v1/goals', goalsRoutes);
app.route('/api/v1/pomodoro', pomodoroRoutes);
app.route('/api/v1/events', eventsRoutes);
app.route('/api/v1/notes', notesRoutes);
app.route('/api/v1/moments', momentsRoutes);
app.route('/api/v1/users', usersRoutes);
app.route('/api/v1/analytics', analyticsRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    
    err.errors.forEach((error) => {
      const field = error.path.join('.');
      fieldErrors[field] = error.message;
    });
    
    return c.json(
      createValidationError(fieldErrors),
      StatusCodes.VALIDATION_ERROR
    );
  }
  
  // Default error response
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;