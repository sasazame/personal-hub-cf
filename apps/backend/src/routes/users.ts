import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { users, userSocialAccounts } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { verifyPassword, hashPassword } from '../utils/auth';
import { springBootValidator } from '../utils/validation';
import { createErrorResponse, createValidationError, ErrorCodes, StatusCodes } from '../utils/spring-boot-compat';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Validation schemas
const updateProfileSchema = z.object({
  username: z.string().min(3).optional(),
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  profilePictureUrl: z.string().url().optional(),
  locale: z.string().optional(),
  weekStartDay: z.number().min(0).max(6).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

const updateEmailSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const updatePreferencesSchema = z.object({
  weekStartDay: z.number().min(0).max(6).optional(),
  locale: z.string().optional(),
});

// GET /users/profile
app.get('/profile', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  
  try {
    const user = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      emailVerified: users.emailVerified,
      profilePictureUrl: users.profilePictureUrl,
      givenName: users.givenName,
      familyName: users.familyName,
      locale: users.locale,
      weekStartDay: users.weekStartDay,
      enabled: users.enabled,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId as string))
    .get();
    
    if (!user) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'User not found'),
        404 as ContentfulStatusCode
      );
    }
    
    return c.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /users/profile
app.put('/profile', zValidator('json', updateProfileSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const data = c.req.valid('json');
  
  try {
    // Check if username is already taken
    if (data.username) {
      const existing = await db.select()
        .from(users)
        .where(eq(users.username, data.username))
        .get();
      
      if (existing && existing.id !== userId) {
        return c.json(
          createValidationError({ username: 'Username already taken' }),
          StatusCodes.CONFLICT as ContentfulStatusCode
        );
      }
    }
    
    const result = await db.update(users)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId as string))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        emailVerified: users.emailVerified,
        profilePictureUrl: users.profilePictureUrl,
        givenName: users.givenName,
        familyName: users.familyName,
        locale: users.locale,
        weekStartDay: users.weekStartDay,
      });
    
    return c.json(result[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /users/password
app.put('/password', zValidator('json', changePasswordSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const { currentPassword, newPassword } = c.req.valid('json');
  
  try {
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId as string))
      .get();
    
    if (!user || !user.password) {
      return c.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid request'),
        400
      );
    }
    
    // Verify current password
    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) {
      return c.json(
        createValidationError({ currentPassword: 'Current password is incorrect' }),
        400
      );
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    await db.update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId as string));
    
    return c.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /users/email
app.put('/email', zValidator('json', updateEmailSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const { email, password } = c.req.valid('json');
  
  try {
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId as string))
      .get();
    
    if (!user || !user.password) {
      return c.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid request'),
        400
      );
    }
    
    // Verify password
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return c.json(
        createValidationError({ password: 'Password is incorrect' }),
        400
      );
    }
    
    // Check if email is already taken
    const existing = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .get();
    
    if (existing) {
      return c.json(
        createErrorResponse(ErrorCodes.CONFLICT, 'Email already in use'),
        StatusCodes.CONFLICT as ContentfulStatusCode
      );
    }
    
    await db.update(users)
      .set({
        email,
        emailVerified: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId as string));
    
    // TODO: Send email verification
    
    return c.json({ 
      success: true,
      message: 'Email updated successfully. Please check your email to verify the new address.' 
    });
  } catch (error) {
    console.error('Update email error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /users/preferences
app.put('/preferences', zValidator('json', updatePreferencesSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const data = c.req.valid('json');
  
  try {
    const result = await db.update(users)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId as string))
      .returning({
        weekStartDay: users.weekStartDay,
        locale: users.locale,
      });
    
    return c.json(result[0]);
  } catch (error) {
    console.error('Update preferences error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// GET /users/social-accounts
app.get('/social-accounts', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  
  try {
    const accounts = await db.select({
      id: userSocialAccounts.id,
      provider: userSocialAccounts.provider,
      email: userSocialAccounts.email,
      name: userSocialAccounts.name,
      picture: userSocialAccounts.picture,
      createdAt: userSocialAccounts.createdAt,
    })
    .from(userSocialAccounts)
    .where(eq(userSocialAccounts.userId, userId as string));
    
    return c.json(accounts);
  } catch (error) {
    console.error('Get social accounts error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// DELETE /users/social-accounts/:provider
app.delete('/social-accounts/:provider', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const provider = c.req.param('provider');
  
  try {
    // Check if user has a password or other social accounts
    const [user, socialAccounts] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId as string)).get(),
      db.select().from(userSocialAccounts).where(eq(userSocialAccounts.userId, userId as string))
    ]);
    
    if (!user) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'User not found'),
        404 as ContentfulStatusCode
      );
    }
    
    // Don't allow removing last auth method
    if (!user.password && socialAccounts.length <= 1) {
      return c.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'Cannot remove the last authentication method. Please set a password first.'),
        400
      );
    }
    
    const result = await db.delete(userSocialAccounts)
      .where(and(
        eq(userSocialAccounts.userId, userId as string),
        eq(userSocialAccounts.provider, provider)
      ))
      .returning();
    
    if (!result.length) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Social account not found'),
        404
      );
    }
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete social account error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// DELETE /users/account
app.delete('/account', zValidator('json', z.object({ password: z.string() }), springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const { password } = c.req.valid('json');
  
  try {
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId as string))
      .get();
    
    if (!user) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'User not found'),
        404 as ContentfulStatusCode
      );
    }
    
    // If user has password, verify it
    if (user.password) {
      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        return c.json(
          createValidationError({ password: 'Password is incorrect' }),
          StatusCodes.UNAUTHORIZED as ContentfulStatusCode
        );
      }
    }
    
    // TODO: Delete all user data (todos, notes, etc.) in a transaction
    // For now, just disable the account
    await db.update(users)
      .set({
        enabled: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId as string));
    
    return c.json({ 
      success: true,
      message: 'Account has been disabled. Contact support to permanently delete your data.' 
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// POST /users/verify-email
app.post('/verify-email', zValidator('json', z.object({ token: z.string() }), springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  // const { token } = c.req.valid('json');
  
  try {
    // TODO: Implement email verification token logic
    
    await db.update(users)
      .set({
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId as string));
    
    return c.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

export default app;