import { Hono } from 'hono';
import { users } from '../db/schema';
import type { Bindings, Variables } from '../types';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Debug endpoint to test database
app.get('/test-db', async (c) => {
  try {
    const db = c.get('db');
    
    // Try to count users
    const result = await db.select().from(users).limit(1);
    
    return c.json({
      success: true,
      message: 'Database connection works',
      userCount: result.length,
    });
  } catch (error) {
    console.error('Database test error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default app;