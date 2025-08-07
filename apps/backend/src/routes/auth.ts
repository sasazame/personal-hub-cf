import { Hono, Context } from 'hono';
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
  ErrorCodes,
  ValidationMessages,
  StatusCodes
} from '../utils/spring-boot-compat';
import { createLocalizedError, createLocalizedValidationError, getUserLanguage } from '../utils/i18n';
import { springBootValidator } from '../utils/validation';
import { authRateLimiter } from '../middleware/rate-limiter';
import { generateAndSetCSRFToken } from '../middleware/csrf';
import { authMiddleware } from '../middleware/auth';
import { setCookie, getCookie } from 'hono/cookie';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Cookie names
const ACCESS_TOKEN_COOKIE = 'access-token';
const REFRESH_TOKEN_COOKIE = 'refresh-token';
const SESSION_COOKIE = 'session-id';


// Helper function to set auth cookies
function setAuthCookies(c: Context<{ Bindings: Bindings; Variables: Variables }>, accessToken: string, refreshToken: string) {
  const isProduction = c.env?.ENVIRONMENT === 'production';
  
  // Set access token cookie (15 minutes)
  setCookie(c, ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax', // Use 'None' for cross-domain in production
    path: '/',
    maxAge: 15 * 60, // 15 minutes
  });
  
  // Set refresh token cookie (7 days)
  setCookie(c, REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax', // Use 'None' for cross-domain in production
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  
  // Set session cookie with last activity timestamp
  const sessionData = {
    lastActivity: Date.now(),
    userId: null // Will be set after decoding token
  };
  setCookie(c, SESSION_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax', // Use 'None' for cross-domain in production
    path: '/',
    maxAge: 30 * 60, // 30 minutes
  });
}

// Helper function to clear auth cookies
function clearAuthCookies(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
  const isProduction = c.env?.ENVIRONMENT === 'production';
  
  // Clear cookies with the same attributes used when setting them
  const sameSite = isProduction ? 'None' : 'Lax';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSite as 'None' | 'Lax',
    path: '/',
    maxAge: 0, // This immediately expires the cookie
  };
  
  setCookie(c, ACCESS_TOKEN_COOKIE, '', cookieOptions);
  setCookie(c, REFRESH_TOKEN_COOKIE, '', cookieOptions);
  setCookie(c, SESSION_COOKIE, '', cookieOptions);
}

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
app.post('/register', authRateLimiter, zValidator('json', registerSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const { email, password, username } = c.req.valid('json');
  
  try {
    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return c.json(
        createLocalizedError('EMAIL_ALREADY_EXISTS', c),
        StatusCodes.USER_EXISTS as ContentfulStatusCode
      );
    }
    
    // Check if username is taken
    const existingUsername = await db.select().from(users).where(eq(users.username, username)).get();
    if (existingUsername) {
      const language = getUserLanguage(c);
      const message = language === 'ja' ? 'ユーザー名は既に使用されています' : 'Username is already taken';
      return c.json(
        createLocalizedValidationError({ username: message }, c),
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
    
    // Generate and set CSRF token
    const csrfToken = generateAndSetCSRFToken(c);
    
    // Set auth cookies
    setAuthCookies(c, tokens.accessToken, tokens.refreshToken);
    
    // Return user data without tokens (they're in cookies now)
    return c.json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        roles: []
      },
      csrfToken
    }, StatusCodes.CREATED as ContentfulStatusCode);
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
app.post('/login', authRateLimiter, zValidator('json', loginSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const { email, password } = c.req.valid('json');
  
  try {
    // Find user
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      // Match Spring Boot behavior - returns AUTHENTICATION_FAILED for non-existent user
      return c.json(
        createLocalizedError('AUTHENTICATION_FAILED', c),
        StatusCodes.AUTHENTICATION_FAILED as ContentfulStatusCode
      );
    }
    
    if (!user.password) {
      // User registered via OAuth
      const language = getUserLanguage(c);
      const message = language === 'ja' ? 'ソーシャルアカウントでログインしてください' : 'Please login using your social account';
      return c.json(
        createLocalizedError('AUTHENTICATION_FAILED', c, { detail: message }),
        StatusCodes.AUTHENTICATION_FAILED as ContentfulStatusCode
      );
    }
    
    // Verify password
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return c.json(
        createLocalizedError('AUTHENTICATION_FAILED', c),
        StatusCodes.AUTHENTICATION_FAILED as ContentfulStatusCode
      );
    }
    
    // Check if user is enabled
    if (!user.enabled) {
      const language = getUserLanguage(c);
      const message = language === 'ja' ? 'アカウントが無効です' : 'Account is disabled';
      return c.json(
        createLocalizedError('FORBIDDEN', c, { detail: message }),
        StatusCodes.FORBIDDEN as ContentfulStatusCode as ContentfulStatusCode
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
    
    // Generate and set CSRF token
    const csrfToken = generateAndSetCSRFToken(c);
    
    // Set auth cookies
    setAuthCookies(c, tokens.accessToken, tokens.refreshToken);
    
    // Return user data without tokens (they're in cookies now)
    return c.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: []
      },
      csrfToken
    });
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
app.post('/refresh', async (c) => {
  const db = c.get('db');
  // Get refresh token from cookie instead of body
  const refreshToken = getCookie(c, REFRESH_TOKEN_COOKIE);
  
  if (!refreshToken) {
    return c.json(
      createErrorResponse(ErrorCodes.INVALID_TOKEN, 'Refresh token not found'),
      StatusCodes.INVALID_TOKEN as ContentfulStatusCode
    );
  }
  
  try {
    // Verify refresh token
    const decoded = await verifyToken(refreshToken, c.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return c.json(
        createErrorResponse(ErrorCodes.INVALID_TOKEN),
        StatusCodes.INVALID_TOKEN as ContentfulStatusCode
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
        StatusCodes.INVALID_TOKEN as ContentfulStatusCode
      );
    }
    
    if (new Date(storedToken.expiresAt) < new Date()) {
      return c.json(
        createErrorResponse(ErrorCodes.TOKEN_EXPIRED),
        StatusCodes.TOKEN_EXPIRED as ContentfulStatusCode
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
        StatusCodes.USER_NOT_FOUND as ContentfulStatusCode
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
    
    // Generate and set CSRF token
    const csrfToken = generateAndSetCSRFToken(c);
    
    // Set new auth cookies
    setAuthCookies(c, tokens.accessToken, tokens.refreshToken);
    
    // Return user data without tokens
    return c.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: []
      },
      csrfToken
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INVALID_TOKEN),
      StatusCodes.INVALID_TOKEN as ContentfulStatusCode
    );
  }
});

// GET /auth/me
app.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const db = c.get('db');
  
  if (!userId) {
    return c.text('Unauthorized', StatusCodes.UNAUTHORIZED as ContentfulStatusCode);
  }
  
  const user = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .get();
  
  if (!user) {
    return c.text('Forbidden', StatusCodes.FORBIDDEN as ContentfulStatusCode);
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
});

// POST /auth/forgot-password
app.post('/forgot-password', authRateLimiter, zValidator('json', forgotPasswordSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const { email } = c.req.valid('json');
  
  try {
    // Find user
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    
    // Always return same message to prevent email enumeration
    const language = getUserLanguage(c);
    const message = language === 'ja' 
      ? 'このメールアドレスのアカウントが存在する場合、パスワードリセット用のメールが送信されます。'
      : 'If an account with this email exists, you will receive a password reset email.';
    
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
    
    const language = getUserLanguage(c);
    const message = language === 'ja' ? 'パスワードがリセットされました' : 'Password has been reset successfully';
    return c.json({ success: true, message });
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
  return c.text('Forbidden', StatusCodes.FORBIDDEN as ContentfulStatusCode as ContentfulStatusCode);
});

app.post('/oidc/github/callback', (c) => {
  // Match Spring Boot - returns 403 for invalid callback
  return c.text('Forbidden', StatusCodes.FORBIDDEN as ContentfulStatusCode as ContentfulStatusCode);
});

// POST /auth/logout - Spring Boot endpoint
app.post('/logout', async (c) => {
  // Clear all auth cookies
  clearAuthCookies(c);
  
  // Optionally revoke refresh token in database
  const refreshToken = getCookie(c, REFRESH_TOKEN_COOKIE);
  if (refreshToken) {
    try {
      await verifyToken(refreshToken, c.env.JWT_SECRET);
      const db = c.get('db');
      const tokenHash = await createHash(refreshToken);
      await db.update(refreshTokens)
        .set({ revoked: true, revokedAt: new Date().toISOString() })
        .where(eq(refreshTokens.tokenHash, tokenHash));
    } catch {
      // Ignore errors during logout
    }
  }
  
  const language = getUserLanguage(c);
  const message = language === 'ja' ? 'ログアウトしました' : 'Logged out successfully';
  return c.json({ success: true, message });
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