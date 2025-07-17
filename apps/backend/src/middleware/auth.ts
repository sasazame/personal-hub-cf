import type { Context } from 'hono';
import { initializeLucia } from '../lib/auth';
import type { AuthEnv } from '../types';

export async function requireAuth(c: Context<AuthEnv>, next: () => Promise<void>) {
  try {
    const lucia = initializeLucia(c.env.DB);
    const sessionId = lucia.readSessionCookie(c.req.header('Cookie') ?? '');

    if (!sessionId) {
      return c.json({ error: 'Not authenticated' }, 401);
    }

    const { session, user } = await lucia.validateSession(sessionId);

    if (!session || !user) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    // Store user in context for routes to use
    c.set('user', user);
    await next();
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
}