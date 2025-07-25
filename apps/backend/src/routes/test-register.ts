import { Hono } from 'hono';
import { users, refreshTokens } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { nanoid } from '../utils/nanoid';
import { hashPassword, generateTokens, verifyPassword } from '../utils/auth';
import { createHash } from '../utils/crypto';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Minimal registration test
app.post('/minimal', async (c) => {
  const db = c.get('db');
  
  try {
    const userId = nanoid();
    const now = new Date().toISOString();
    
    // Test 1: Create user
    console.log('Test 1: Creating user...');
    await db.insert(users).values({
      id: userId,
      email: `test_${Date.now()}@example.com`,
      password: 'hashed_password',
      username: `test_${Date.now()}`,
      emailVerified: false,
      enabled: true,
      weekStartDay: 1,
      createdAt: now,
      updatedAt: now,
    });
    console.log('User created successfully');
    
    // Test 2: Create refresh token
    console.log('Test 2: Creating refresh token...');
    await db.insert(refreshTokens).values({
      id: nanoid(),
      tokenHash: 'test_hash_' + Date.now(),
      userId: userId,
      clientId: 'web',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
    });
    console.log('Refresh token created successfully');
    
    return c.json({ success: true, userId });
  } catch (error) {
    console.error('Test error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, 500);
  }
});

// Test individual functions
app.post('/test-functions', async (c) => {
  try {
    const results: any = {};
    
    // Test 1: Hash password
    console.log('Testing hashPassword...');
    try {
      const hashed = await hashPassword('Test123!@#');
      results.hashPassword = { success: true, length: hashed.length };
      console.log('hashPassword success');
    } catch (e) {
      results.hashPassword = { success: false, error: e instanceof Error ? e.message : 'Unknown' };
      console.error('hashPassword failed:', e);
    }
    
    // Test 2: Generate tokens
    console.log('Testing generateTokens...');
    try {
      const tokens = await generateTokens('test-user-id', c.env.JWT_SECRET);
      results.generateTokens = { 
        success: true, 
        hasAccess: !!tokens.accessToken,
        hasRefresh: !!tokens.refreshToken 
      };
      console.log('generateTokens success');
    } catch (e) {
      results.generateTokens = { success: false, error: e instanceof Error ? e.message : 'Unknown' };
      console.error('generateTokens failed:', e);
    }
    
    // Test 3: Create hash
    console.log('Testing createHash...');
    try {
      const hash = await createHash('test-string');
      results.createHash = { success: true, length: hash.length };
      console.log('createHash success');
    } catch (e) {
      results.createHash = { success: false, error: e instanceof Error ? e.message : 'Unknown' };
      console.error('createHash failed:', e);
    }
    
    return c.json({ success: true, results });
  } catch (error) {
    console.error('Test functions error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Full registration flow test
app.post('/full-flow', async (c) => {
  const db = c.get('db');
  
  try {
    const email = `fulltest_${Date.now()}@example.com`;
    const password = 'Test123!@#';
    const username = `fulltest_${Date.now()}`;
    
    console.log('Starting full registration flow...');
    
    // Step 1: Hash password
    console.log('Step 1: Hashing password...');
    const hashedPassword = await hashPassword(password);
    console.log('Password hashed successfully');
    
    // Step 2: Create user
    const userId = nanoid();
    const now = new Date().toISOString();
    const newUser = {
      id: userId,
      email,
      password: hashedPassword,
      username,
      emailVerified: false,
      enabled: true,
      weekStartDay: 1,
      createdAt: now,
      updatedAt: now,
    };
    
    console.log('Step 2: Creating user...');
    await db.insert(users).values(newUser);
    console.log('User created successfully');
    
    // Step 3: Generate tokens
    console.log('Step 3: Generating tokens...');
    const tokens = await generateTokens(userId, c.env.JWT_SECRET);
    console.log('Tokens generated successfully');
    
    // Step 4: Hash refresh token
    console.log('Step 4: Hashing refresh token...');
    const tokenHash = await createHash(tokens.refreshToken);
    console.log('Refresh token hashed successfully');
    
    // Step 5: Store refresh token
    const refreshTokenData = {
      id: nanoid(),
      tokenHash,
      userId,
      clientId: 'web',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
    };
    
    console.log('Step 5: Storing refresh token...');
    await db.insert(refreshTokens).values(refreshTokenData);
    console.log('Refresh token stored successfully');
    
    console.log('Full registration flow completed!');
    
    return c.json({
      success: true,
      user: { ...newUser, password: '[REDACTED]' },
      tokens: {
        accessToken: tokens.accessToken.substring(0, 20) + '...',
        refreshToken: tokens.refreshToken.substring(0, 20) + '...',
      }
    });
  } catch (error) {
    console.error('Full flow error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, 500);
  }
});

// Test registration without zValidator
app.post('/register-no-validator', async (c) => {
  const db = c.get('db');
  
  try {
    const body = await c.req.json();
    const { email, password, username } = body;
    
    console.log('Received registration request:', { email, username });
    
    // Manual validation
    if (!email || !email.includes('@')) {
      return c.json({ error: 'Invalid email' }, 400);
    }
    if (!password || password.length < 8) {
      return c.json({ error: 'Password too short' }, 400);
    }
    if (!username || username.length < 3) {
      return c.json({ error: 'Username too short' }, 400);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const userId = nanoid();
    const now = new Date().toISOString();
    const newUser = {
      id: userId,
      email,
      password: hashedPassword,
      username,
      emailVerified: false,
      enabled: true,
      weekStartDay: 1,
      createdAt: now,
      updatedAt: now,
    };
    
    await db.insert(users).values(newUser);
    
    // Generate tokens
    const tokens = await generateTokens(userId, c.env.JWT_SECRET);
    
    // Store refresh token
    await db.insert(refreshTokens).values({
      id: nanoid(),
      tokenHash: await createHash(tokens.refreshToken),
      userId,
      clientId: 'web',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
    });
    
    return c.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        weekStartDay: newUser.weekStartDay,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      }
    }, 201);
  } catch (error) {
    console.error('Register no validator error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Test password hashing and verification
app.post('/test-password', async (c) => {
  try {
    const password = 'Test123!';
    
    console.log('Testing password:', password);
    
    // Hash password
    const hashed = await hashPassword(password);
    console.log('Hashed password:', hashed);
    
    // Verify correct password
    const valid1 = await verifyPassword(password, hashed);
    console.log('Verify correct password:', valid1);
    
    // Verify wrong password
    const valid2 = await verifyPassword('Wrong123!', hashed);
    console.log('Verify wrong password:', valid2);
    
    return c.json({
      success: true,
      hashedLength: hashed.length,
      correctPasswordValid: valid1,
      wrongPasswordValid: valid2,
    });
  } catch (error) {
    console.error('Password test error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, 500);
  }
});

export default app;