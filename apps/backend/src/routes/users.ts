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
import { createValidationError, StatusCodes } from '../utils/spring-boot-compat';
import { createLocalizedError } from '../utils/i18n';
import { createSecurityEventLogger } from '../utils/security-events';

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

// Align preferences schema with settings constraints to prevent data conflicts
const updatePreferencesSchema = z.object({
  // Constrain weekStartDay to only valid values that match /settings endpoint
  weekStartDay: z.union([z.literal(0), z.literal(1), z.literal(6)]).optional(),
  // Constrain locale to only supported languages
  locale: z.enum(['ja', 'en']).optional(),
}).strict();

// Default feature preferences - single source of truth
export const DEFAULT_FEATURE_PREFERENCES = Object.freeze({
  todos: true,
  goals: true,
  pomodoro: true,
  calendar: true,
  notes: true,
  moments: true,
  analytics: true,
});

export type FeaturePreferences = typeof DEFAULT_FEATURE_PREFERENCES;

const updateFeaturePreferencesSchema = z.object({
  todos: z.boolean().optional(),
  goals: z.boolean().optional(),
  pomodoro: z.boolean().optional(),
  calendar: z.boolean().optional(),
  notes: z.boolean().optional(),
  moments: z.boolean().optional(),
  analytics: z.boolean().optional(),
}).strict(); // Reject unknown keys

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
      featurePreferences: users.featurePreferences,
      enabled: users.enabled,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId as string))
    .get();
    
    if (!user) {
      return c.json(
        createLocalizedError('NOT_FOUND', c, { detail: 'User not found' }),
        404 as ContentfulStatusCode
      );
    }
    
    return c.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
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
        featurePreferences: users.featurePreferences,
      });
    
    return c.json(result[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /users/password
app.put('/password', zValidator('json', changePasswordSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const { currentPassword, newPassword } = c.req.valid('json');
  const securityLogger = createSecurityEventLogger(c, db);
  
  try {
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId as string))
      .get();
    
    if (!user || !user.password) {
      return c.json(
        createLocalizedError('VALIDATION_ERROR', c, { detail: 'Invalid request' }),
        400
      );
    }
    
    // Verify current password
    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) {
      await securityLogger.suspiciousActivity('Failed password change attempt - incorrect current password', {
        userId: userId as string,
        reason: 'incorrect_password'
      });
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
    
    // Log successful password change
    await securityLogger.passwordResetSuccess(userId as string);
    
    return c.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    await securityLogger.suspiciousActivity('Password change failed due to error', {
      userId: userId as string,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /users/email
app.put('/email', zValidator('json', updateEmailSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const { email, password } = c.req.valid('json');
  const securityLogger = createSecurityEventLogger(c, db);
  
  try {
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId as string))
      .get();
    
    if (!user || !user.password) {
      return c.json(
        createLocalizedError('VALIDATION_ERROR', c, { detail: 'Invalid request' }),
        400
      );
    }
    
    // Verify password
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      await securityLogger.suspiciousActivity('Failed email change attempt - incorrect password', {
        userId: userId as string,
        newEmail: email,
        reason: 'incorrect_password'
      });
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
        createLocalizedError('CONFLICT', c, { detail: 'Email already in use' }),
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
    
    // Log successful email change
    await securityLogger.suspiciousActivity('Email change successful', {
      userId: userId as string,
      newEmail: email,
      reason: 'email_changed'
    });
    
    // TODO: Send email verification
    
    return c.json({ 
      success: true,
      message: 'Email updated successfully. Please check your email to verify the new address.' 
    });
  } catch (error) {
    console.error('Update email error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// User settings type - only includes fields that are persisted in database
// Note: Other settings (theme, timezone, notifications, etc.) should be handled
// via the feature preferences endpoint if needed
export interface UserSettings {
  language: 'ja' | 'en';
  weekStartsOn: 0 | 1 | 6;
}

// Default user settings
const DEFAULT_USER_SETTINGS: UserSettings = {
  language: 'ja',
  weekStartsOn: 1, // Monday
};

// Only accept fields that are actually persisted in the database
const updateUserSettingsSchema = z.object({
  language: z.enum(['ja', 'en']).optional(),
  weekStartsOn: z.union([z.literal(0), z.literal(1), z.literal(6)]).optional(),
}).strict();

// Helper function to map database fields to settings format
function mapDbToUserSettings(dbUser: { locale: string | null; weekStartDay: number | null }): UserSettings {
  // Handle locale values like 'en', 'en-US', 'ja', 'ja-JP' properly
  const locale = (dbUser.locale ?? DEFAULT_USER_SETTINGS.language).toLowerCase();
  const language: 'ja' | 'en' = locale.startsWith('en') ? 'en' : 'ja';
  
  // Validate weekStartDay is one of the allowed values (0, 1, 6)
  const rawWeekStartDay = dbUser.weekStartDay ?? DEFAULT_USER_SETTINGS.weekStartsOn;
  const weekStartsOn: 0 | 1 | 6 = (rawWeekStartDay === 0 || rawWeekStartDay === 1 || rawWeekStartDay === 6) 
    ? rawWeekStartDay 
    : 1; // Default to Monday if invalid value
  
  return { language, weekStartsOn };
}

// GET /users/settings
app.get('/settings', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  
  try {
    const user = await db.select({
      locale: users.locale,
      weekStartDay: users.weekStartDay,
    })
    .from(users)
    .where(eq(users.id, userId as string))
    .get();
    
    if (!user) {
      return c.json(
        createLocalizedError('NOT_FOUND', c, { detail: 'User not found' }),
        404 as ContentfulStatusCode
      );
    }
    
    // Map database fields to settings format using helper function
    const settings = mapDbToUserSettings(user);
    
    return c.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /users/settings
app.put('/settings', zValidator('json', updateUserSettingsSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const data = c.req.valid('json');
  
  try {
    // Map settings to database fields
    const dbUpdates: Partial<{
      updatedAt: string;
      locale: string;
      weekStartDay: number;
    }> = {
      updatedAt: new Date().toISOString(),
    };
    
    if (data.language !== undefined) {
      dbUpdates.locale = data.language;
    }
    
    if (data.weekStartsOn !== undefined) {
      dbUpdates.weekStartDay = data.weekStartsOn;
    }
    
    // Use returning() to get updated values in one query and detect if update was successful
    const updatedRows = await db.update(users)
      .set(dbUpdates)
      .where(eq(users.id, userId as string))
      .returning({
        locale: users.locale,
        weekStartDay: users.weekStartDay,
      });
    
    const updatedUser = updatedRows[0];
    
    if (!updatedUser) {
      return c.json(
        createLocalizedError('NOT_FOUND', c, { detail: 'User not found' }),
        404 as ContentfulStatusCode
      );
    }
    
    // Map database fields to settings format using helper function
    const settings = mapDbToUserSettings(updatedUser);
    
    return c.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
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
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// GET /users/feature-preferences
app.get('/feature-preferences', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  
  try {
    const user = await db.select({
      featurePreferences: users.featurePreferences,
    })
    .from(users)
    .where(eq(users.id, userId as string))
    .get();
    
    if (!user) {
      return c.json(
        createLocalizedError('NOT_FOUND', c, { detail: 'User not found' }),
        404 as ContentfulStatusCode
      );
    }
    
    // Parse the JSON string or return default preferences
    let preferences = DEFAULT_FEATURE_PREFERENCES;
    if (user.featurePreferences) {
      try {
        const parsed = JSON.parse(user.featurePreferences);
        // Merge with defaults to ensure new keys are included
        preferences = { ...DEFAULT_FEATURE_PREFERENCES, ...parsed };
      } catch (error) {
        console.warn('Invalid featurePreferences JSON, falling back to defaults:', error);
        preferences = DEFAULT_FEATURE_PREFERENCES;
      }
    }
    
    return c.json(preferences);
  } catch (error) {
    console.error('Get feature preferences error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /users/feature-preferences
app.put('/feature-preferences', zValidator('json', updateFeaturePreferencesSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const data = c.req.valid('json');
  
  try {
    // Get current preferences
    const user = await db.select({
      featurePreferences: users.featurePreferences,
    })
    .from(users)
    .where(eq(users.id, userId as string))
    .get();
    
    let currentPreferences = DEFAULT_FEATURE_PREFERENCES;
    if (user?.featurePreferences) {
      try {
        const parsed = JSON.parse(user.featurePreferences);
        // Merge with defaults to ensure all keys are present
        currentPreferences = { ...DEFAULT_FEATURE_PREFERENCES, ...parsed };
      } catch (error) {
        console.warn('Invalid featurePreferences JSON, using defaults:', error);
        currentPreferences = DEFAULT_FEATURE_PREFERENCES;
      }
    }
    
    // Merge with new preferences
    const updatedPreferences = { ...currentPreferences, ...data };
    
    await db.update(users)
      .set({
        featurePreferences: JSON.stringify(updatedPreferences),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId as string));
    
    return c.json(updatedPreferences);
  } catch (error) {
    console.error('Update feature preferences error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
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
      createLocalizedError('INTERNAL_ERROR', c),
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
        createLocalizedError('NOT_FOUND', c, { detail: 'User not found' }),
        404 as ContentfulStatusCode
      );
    }
    
    // Don't allow removing last auth method
    if (!user.password && socialAccounts.length <= 1) {
      // Use a custom error response to match test expectations
      return c.json({
        code: 'VALIDATION_ERROR',
        message: 'Cannot remove the last authentication method. Please set a password first.',
        timestamp: new Date().toISOString()
      }, 400);
    }
    
    const result = await db.delete(userSocialAccounts)
      .where(and(
        eq(userSocialAccounts.userId, userId as string),
        eq(userSocialAccounts.provider, provider)
      ))
      .returning();
    
    if (!result.length) {
      return c.json(
        createLocalizedError('NOT_FOUND', c, { detail: 'Social account not found' }),
        404
      );
    }
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete social account error:', error);
    return c.json(
      createLocalizedError('INTERNAL_ERROR', c),
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
        createLocalizedError('NOT_FOUND', c, { detail: 'User not found' }),
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
      createLocalizedError('INTERNAL_ERROR', c),
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
      createLocalizedError('INTERNAL_ERROR', c),
      500 as ContentfulStatusCode
    );
  }
});

export default app;