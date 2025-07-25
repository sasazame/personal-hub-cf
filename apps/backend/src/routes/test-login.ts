import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { users, refreshTokens } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { nanoid } from '../utils/nanoid';
import { hashPassword, verifyPassword, generateTokens } from '../utils/auth';
import { createHash } from '../utils/crypto';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Test complete login flow
app.post('/test-complete-flow', async (c) => {
  const db = c.get('db');
  
  try {
    const email = `flowtest_${Date.now()}@example.com`;
    const password = 'Test123!';
    const username = `flowtest_${Date.now()}`;
    
    console.log('=== Testing Complete Login Flow ===');
    
    // Step 1: Register user
    console.log('Step 1: Registering user...');
    const hashedPassword = await hashPassword(password);
    const userId = nanoid();
    const now = new Date().toISOString();
    
    await db.insert(users).values({
      id: userId,
      email,
      password: hashedPassword,
      username,
      emailVerified: false,
      enabled: true,
      weekStartDay: 1,
      createdAt: now,
      updatedAt: now,
    });
    console.log('User registered successfully');
    
    // Step 2: Retrieve user
    console.log('\nStep 2: Retrieving user...');
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    console.log('User retrieved:', !!user);
    console.log('User ID:', user?.id);
    console.log('User password hash length:', user?.password?.length);
    
    if (!user) {
      throw new Error('User not found after registration');
    }
    
    // Step 3: Verify password
    console.log('\nStep 3: Verifying password...');
    const isValid = await verifyPassword(password, user.password!);
    console.log('Password verification result:', isValid);
    
    if (!isValid) {
      throw new Error('Password verification failed');
    }
    
    // Step 4: Generate tokens
    console.log('\nStep 4: Generating tokens...');
    const tokens = await generateTokens(user.id, c.env.JWT_SECRET);
    console.log('Tokens generated successfully');
    
    // Step 5: Store refresh token
    console.log('\nStep 5: Storing refresh token...');
    await db.insert(refreshTokens).values({
      id: nanoid(),
      tokenHash: await createHash(tokens.refreshToken),
      userId: user.id,
      clientId: 'web',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
    });
    console.log('Refresh token stored successfully');
    
    console.log('\n=== Complete Flow Test Successful ===');
    
    return c.json({
      success: true,
      message: 'Complete login flow test passed',
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Complete flow test error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, 500);
  }
});

// Test login without validator
app.post('/login-no-validator', async (c) => {
  const db = c.get('db');
  
  try {
    const body = await c.req.json();
    console.log('Received body:', JSON.stringify(body));
    const { email, password } = body;
    
    console.log('Login attempt (no validator) for:', email);
    
    // Find user
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }
    
    // Verify password
    const valid = await verifyPassword(password, user.password!);
    if (!valid) {
      return c.json({ error: 'Invalid password' }, 401);
    }
    
    // Generate tokens
    const tokens = await generateTokens(user.id, c.env.JWT_SECRET);
    
    // Store refresh token
    await db.insert(refreshTokens).values({
      id: nanoid(),
      tokenHash: await createHash(tokens.refreshToken),
      userId: user.id,
      clientId: 'web',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });
    
    return c.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        weekStartDay: user.weekStartDay,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    console.error('Login no validator error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, 500);
  }
});

export default app;