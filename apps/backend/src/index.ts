import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { cors } from 'hono/cors';
import { ZodError } from 'zod';
import { createDb } from './db';
import type { Bindings, Variables } from './types';
import authRoutes from './routes/auth';
import twoFARoutes from './routes/2fa';
import todosRoutes from './routes/todos';
import goalsRoutes from './routes/goals';
import pomodoroRoutes from './routes/pomodoro';
import eventsRoutes from './routes/events';
import notesRoutes from './routes/notes';
import momentsRoutes from './routes/moments';
import usersRoutes from './routes/users';
import analyticsRoutes from './routes/analytics';
import { createValidationError } from './utils/spring-boot-compat';
import { securityHeaders } from './middleware/security-headers';
import { csrfMiddleware } from './middleware/csrf';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply security headers middleware
app.use('*', securityHeaders);

// Apply CORS middleware
app.use('*', cors({
  origin: (origin, c) => {
    // Allow requests without origin (e.g., mobile apps, Postman)
    if (!origin) {
      return null;
    }
    
    const env = c.env as Bindings;
    const isDevEnvironment = env.ENVIRONMENT === 'development' || !env.ENVIRONMENT;
    
    // In development, allow localhost origins
    if (isDevEnvironment && origin.startsWith('http://localhost:')) {
      return origin;
    }
    
    // Use allowed origins from environment variable
    const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [];
    
    // In development, add default localhost origins if none specified
    if (isDevEnvironment && allowedOrigins.length === 0) {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174');
    }
    
    // Check if origin is in allowed list or matches wildcard pattern
    for (const allowedOrigin of allowedOrigins) {
      if (allowedOrigin.includes('*')) {
        // Convert wildcard pattern to regex
        const pattern = allowedOrigin
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
          .replace(/\*/g, '.*'); // Replace * with .*
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(origin)) {
          return origin;
        }
      } else if (allowedOrigin === origin) {
        return origin;
      }
    }
    
    // Origin not allowed
    return null;
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Database middleware
app.use('*', async (c, next) => {
  const db = createDb(c.env.DB);
  c.set('db', db);
  await next();
});

// CSRF protection middleware (applied to all routes except excluded ones)
app.use('*', csrfMiddleware);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', environment: c.env.ENVIRONMENT || 'development' });
});

// API version endpoint
app.get('/api/v1', (c) => {
  return c.json({ 
    message: 'Personal Hub API v1',
    version: '1.0.0',
    status: 'active'
  });
});

// Mount routes
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/2fa', twoFARoutes);
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
  return c.json({ error: 'Not found' }, 404 as ContentfulStatusCode);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    
    err.issues.forEach((error) => {
      const field = error.path.join('.');
      fieldErrors[field] = error.message;
    });
    
    return c.json(
      createValidationError(fieldErrors),
      400 as ContentfulStatusCode
    );
  }
  
  // Default error response
  return c.json({ error: 'Internal server error' }, 500 as ContentfulStatusCode);
});

export default app;