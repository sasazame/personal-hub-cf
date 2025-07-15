import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '@personal-hub/shared';
import { initializeLucia } from '../lib/auth';
import { hashPassword, verifyPassword } from '../lib/password';
import { generateId } from 'lucia';

type Env = {
  Bindings: {
    DB: D1Database;
  };
};

const authRouter = new Hono<Env>();

// Registration schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register endpoint
authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, username, firstName, lastName } = c.req.valid('json');
  const db = drizzle(c.env.DB);
  const lucia = initializeLucia(c.env.DB);

  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = generateId(15);
    const newUser = await db
      .insert(users)
      .values({
        id: userId,
        email,
        password: hashedPassword,
        username,
        firstName,
        lastName,
        emailVerified: false,
        enabled: true,
      })
      .returning()
      .get();

    // Create session
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Set cookie
    c.header('Set-Cookie', sessionCookie.serialize());

    return c.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Failed to register user' }, 500);
  }
});

// Login endpoint
authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const db = drizzle(c.env.DB);
  const lucia = initializeLucia(c.env.DB);

  try {
    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (!user || !user.password) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const validPassword = await verifyPassword(user.password, password);
    if (!validPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Check if user is enabled
    if (!user.enabled) {
      return c.json({ error: 'Account is disabled' }, 401);
    }

    // Create session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Set cookie
    c.header('Set-Cookie', sessionCookie.serialize());

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Failed to login' }, 500);
  }
});

// Logout endpoint
authRouter.post('/logout', async (c) => {
  const lucia = initializeLucia(c.env.DB);
  
  const sessionId = lucia.readSessionCookie(c.req.header('Cookie') ?? '');
  if (sessionId) {
    await lucia.invalidateSession(sessionId);
  }

  const blankSessionCookie = lucia.createBlankSessionCookie();
  c.header('Set-Cookie', blankSessionCookie.serialize());

  return c.json({ success: true });
});

// Get current user endpoint
authRouter.get('/me', async (c) => {
  const lucia = initializeLucia(c.env.DB);
  
  const sessionId = lucia.readSessionCookie(c.req.header('Cookie') ?? '');
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (!session) {
    return c.json({ error: 'Invalid session' }, 401);
  }

  return c.json({ user });
});

export default authRouter;