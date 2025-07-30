import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { users, refreshTokens, passwordResetTokens } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { nanoid } from '../utils/nanoid';
import { createHash } from '../utils/crypto';
import { hashPassword, verifyPassword, generateTokens, verifyToken } from '../utils/auth';
import { 
  createErrorResponse, 
  createValidationError, 
  createAuthResponse,
  ErrorCodes,
  ErrorMessages,
  ValidationMessages,
  StatusCodes
} from '../utils/spring-boot-compat';
import { springBootValidator } from '../utils/validation';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Validation schemas - matching Spring Boot requirements
const registerSchema = z.object({
  email: z.string().email(ValidationMessages.EMAIL_INVALID),
  password: z.string()
    .min(8, ValidationMessages.PASSWORD_WEAK)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/, ValidationMessages.PASSWORD_WEAK),
  username: z.string()
    .min(3, ValidationMessages.USERNAME_INVALID)
    .max(20, ValidationMessages.USERNAME_INVALID),
});

const loginSchema = z.object({
  email: z.string().email(ValidationMessages.EMAIL_INVALID),
  password: z.string().min(1, ValidationMessages.PASSWORD_REQUIRED),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(ValidationMessages.EMAIL_INVALID),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string()
    .min(8, ValidationMessages.PASSWORD_WEAK)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/, ValidationMessages.PASSWORD_WEAK),
});

// POST /auth/register
app.post('/register', zValidator('json', registerSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const { email, password, username } = c.req.valid('json');
  
  try {
    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return c.json(
        createErrorResponse(ErrorCodes.EMAIL_ALREADY_EXISTS, ErrorMessages.EMAIL_ALREADY_EXISTS),
        StatusCodes.USER_EXISTS
      );
    }
    
    // Check if username is taken
    const existingUsername = await db.select().from(users).where(eq(users.username, username)).get();
    if (existingUsername) {
      return c.json(
        createValidationError({ username: 'Username is already taken' }),
        400 as ContentfulStatusCode
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const userId = nanoid(); // This returns UUID now
    const now = new Date().toISOString();
    const newUser = {
      id: userId,
      email,
      password: hashedPassword,
      username,
      email_verified: false,
      enabled: true,
      week_start_day: 1,
      created_at: now,
      updated_at: now,
    };
    
    try {
      await db.insert(users).values(newUser);
    } catch (dbError) {
      console.error('Database insert error:', dbError);
      throw dbError;
    }
    
    // Generate tokens
    const tokens = await generateTokens(userId, c.env.JWT_SECRET);
    
    // Store refresh token
    const refreshTokenData = {
      id: nanoid(),
      tokenHash: await createHash(tokens.refreshToken),
      userId: userId,
      clientId: 'web',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
      revoked: false
    };
    
    await db.insert(refreshTokens).values(refreshTokenData);
    
    return c.json(createAuthResponse(newUser, tokens.accessToken, tokens.refreshToken), StatusCodes.CREATED);
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Error details:', JSON.stringify(error, null, 2));
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// POST /auth/login
app.post('/login', zValidator('json', loginSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const { email, password } = c.req.valid('json');
  
  try {
    // Find user
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      // Match Spring Boot behavior - returns AUTHENTICATION_FAILED for non-existent user
      return c.json(
        createErrorResponse(ErrorCodes.AUTHENTICATION_FAILED),
        StatusCodes.AUTHENTICATION_FAILED
      );
    }
    
    if (!user.password) {
      // User registered via OAuth
      return c.json(
        createErrorResponse(ErrorCodes.AUTHENTICATION_FAILED, 'Please login using your social account'),
        StatusCodes.AUTHENTICATION_FAILED
      );
    }
    
    // Verify password
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return c.json(
        createErrorResponse(ErrorCodes.AUTHENTICATION_FAILED),
        StatusCodes.AUTHENTICATION_FAILED
      );
    }
    
    // Check if user is enabled
    if (!user.enabled) {
      return c.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, 'Account is disabled'),
        StatusCodes.FORBIDDEN
      );
    }
    
    // Generate tokens
    const tokens = await generateTokens(user.id, c.env.JWT_SECRET);
    
    // Revoke any existing refresh tokens for this user
    await db.update(refreshTokens)
      .set({ revoked: true })
      .where(and(
        eq(refreshTokens.userId, user.id),
        eq(refreshTokens.revoked, false)
      ));
    
    // Store new refresh token
    await db.insert(refreshTokens).values({
      id: nanoid(),
      tokenHash: await createHash(tokens.refreshToken),
      userId: user.id,
      clientId: 'web',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      revoked: false
    });
    
    return c.json(createAuthResponse(user, tokens.accessToken, tokens.refreshToken));
  } catch (error) {
    console.error('Login error:', error);
    // Match Spring Boot - returns 500 for unexpected errors
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// POST /auth/refresh
app.post('/refresh', zValidator('json', refreshSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const { refreshToken } = c.req.valid('json');
  
  try {
    // Verify refresh token
    const decoded = await verifyToken(refreshToken, c.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return c.json(
        createErrorResponse(ErrorCodes.INVALID_TOKEN),
        StatusCodes.INVALID_TOKEN
      );
    }
    
    // Check if refresh token exists and is valid
    const tokenHash = await createHash(refreshToken);
    const storedToken = await db.select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .get();
    
    if (!storedToken || storedToken.revoked) {
      return c.json(
        createErrorResponse(ErrorCodes.INVALID_TOKEN),
        StatusCodes.INVALID_TOKEN
      );
    }
    
    if (new Date(storedToken.expires_at) < new Date()) {
      return c.json(
        createErrorResponse(ErrorCodes.TOKEN_EXPIRED),
        StatusCodes.TOKEN_EXPIRED
      );
    }
    
    // Get user
    const user = await db.select()
      .from(users)
      .where(eq(users.id, decoded.sub))
      .get();
    
    if (!user || !user.enabled) {
      return c.json(
        createErrorResponse(ErrorCodes.USER_NOT_FOUND),
        StatusCodes.USER_NOT_FOUND
      );
    }
    
    // Generate new tokens
    const tokens = await generateTokens(user.id, c.env.JWT_SECRET);
    
    // Revoke old refresh token
    await db.update(refreshTokens)
      .set({ revoked: true, revokedAt: new Date().toISOString() })
      .where(eq(refreshTokens.id, storedToken.id));
    
    // Store new refresh token
    await db.insert(refreshTokens).values({
      id: nanoid(),
      tokenHash: await createHash(tokens.refreshToken),
      userId: user.id,
      clientId: 'web',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      revoked: false
    });
    
    return c.json(createAuthResponse(user, tokens.accessToken, tokens.refreshToken));
  } catch (error) {
    console.error('Refresh error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INVALID_TOKEN),
      StatusCodes.INVALID_TOKEN
    );
  }
});

// GET /auth/me
app.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    // Match Spring Boot - returns 403 Forbidden
    return c.text('Forbidden', StatusCodes.FORBIDDEN as any);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = await verifyToken(token, c.env.JWT_SECRET);
    if (decoded.type !== 'access') {
      return c.text('Forbidden', StatusCodes.FORBIDDEN as any);
    }
    
    const db = c.get('db');
    const user = await db.select()
      .from(users)
      .where(eq(users.id, decoded.sub))
      .get();
    
    if (!user || !user.enabled) {
      return c.text('Forbidden', StatusCodes.FORBIDDEN as any);
    }
    
    // Return user data in Spring Boot format
    return c.json({
      id: user.id,
      username: user.username,
      email: user.email,
      weekStartDay: user.weekStartDay,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return c.text('Forbidden', StatusCodes.FORBIDDEN as any);
  }
});

// POST /auth/forgot-password
app.post('/forgot-password', zValidator('json', forgotPasswordSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const { email } = c.req.valid('json');
  
  try {
    // Find user
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    
    // Always return same message to prevent email enumeration
    const message = 'If an account with this email exists, you will receive a password reset email.';
    
    if (user) {
      // Generate reset token
      const resetToken = nanoid();
      await db.insert(passwordResetTokens).values({
        id: nanoid(),
        token: resetToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        createdAt: new Date().toISOString(),
      });
      
      // TODO: Send email with reset link
    }
    
    return c.json({ success: true, message });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// POST /auth/reset-password
app.post('/reset-password', zValidator('json', resetPasswordSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const { token, newPassword } = c.req.valid('json');
  
  try {
    // Find valid reset token
    const resetToken = await db.select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .get();
    
    if (!resetToken || resetToken.used) {
      return c.json(
        createErrorResponse(ErrorCodes.INVALID_TOKEN, 'Invalid or expired reset token'),
        400
      );
    }
    
    if (new Date(resetToken.expiresAt) < new Date()) {
      return c.json(
        createErrorResponse(ErrorCodes.TOKEN_EXPIRED, 'Reset token has expired'),
        400
      );
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update user password
    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, resetToken.userId));
    
    // Mark token as used
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id));
    
    return c.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// OAuth endpoints to match Spring Boot
// GET /auth/oidc/google/authorize
app.get('/oidc/google/authorize', (c) => {
  const redirectUri = `${c.req.url.split('/api')[0]}/api/v1/auth/oidc/google/callback`;
  const state = nanoid();
  const scope = 'openid email profile';
  
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', c.env.OAUTH_GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', state);
  
  return c.json({
    authorizationUrl: url.toString(),
    state,
    provider: 'google'
  });
});

// GET /auth/oidc/github/authorize
app.get('/oidc/github/authorize', (c) => {
  const redirectUri = `${c.req.url.split('/api')[0]}/api/v1/auth/oidc/github/callback`;
  const state = nanoid();
  const scope = 'user:email';
  
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', c.env.OAUTH_GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', state);
  
  return c.json({
    authorizationUrl: url.toString(),
    state,
    provider: 'github'
  });
});

// Placeholder for OAuth callbacks
app.post('/oidc/google/callback', (c) => {
  // Match Spring Boot - returns 403 for invalid callback
  return c.text('Forbidden', StatusCodes.FORBIDDEN);
});

app.post('/oidc/github/callback', (c) => {
  // Match Spring Boot - returns 403 for invalid callback
  return c.text('Forbidden', StatusCodes.FORBIDDEN);
});

// POST /auth/logout - Spring Boot endpoint
app.post('/logout', (c) => {
  // For JWT-based auth, logout is typically handled client-side
  // But we can provide a success response for compatibility
  return c.json({ success: true, message: 'Logged out successfully' });
});

// GET /auth/validate-reset-token
app.get('/validate-reset-token', (c) => {
  const token = c.req.query('token');
  if (!token) {
    return c.json(
      createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'Token is required'),
      400
    );
  }
  
  // TODO: Implement token validation
  return c.json(
    createErrorResponse(ErrorCodes.NOT_FOUND),
    404
  );
});

export default app;