import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { users, user2FASettings, twoFactorRecoveryCodes } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { nanoid } from '../utils/nanoid';
import { generateTOTPSecret, verifyTOTPCode, generateRecoveryCodes } from '../utils/totp';
import { authMiddleware } from '../middleware/auth';
import { StatusCodes } from '../utils/spring-boot-compat';
import { createLocalizedError, createLocalizedValidationError } from '../utils/i18n';
import { springBootValidator } from '../utils/validation';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all 2FA routes
app.use('*', authMiddleware);

// Validation schemas
const enableTOTPSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

const verifyTOTPSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must be numeric'),
});

const disableTOTPSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

// GET /2fa/status - Get 2FA status for the current user
app.get('/status', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId')!;
  
  const settings = await db.select()
    .from(user2FASettings)
    .where(eq(user2FASettings.userId, userId))
    .get();
  
  return c.json({
    enabled: settings?.enabled || false,
    enabledAt: settings?.enabledAt,
    lastUsedAt: settings?.lastUsedAt,
  });
});

// POST /2fa/setup - Start 2FA setup process
app.post('/setup', zValidator('json', enableTOTPSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId')!;
  const { password } = c.req.valid('json');
  
  // Verify user's password first
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) {
    return c.json(
      createLocalizedError('USER_NOT_FOUND', c),
      404 as ContentfulStatusCode
    );
  }
  
  // Import verifyPassword here to avoid circular dependency
  const { verifyPassword } = await import('../utils/auth');
  const validPassword = await verifyPassword(password, user.password!);
  if (!validPassword) {
    return c.json(
      createLocalizedError('AUTHENTICATION_FAILED', c),
      StatusCodes.AUTHENTICATION_FAILED as ContentfulStatusCode
    );
  }
  
  // Check if 2FA is already enabled
  const existingSettings = await db.select()
    .from(user2FASettings)
    .where(eq(user2FASettings.userId, userId))
    .get();
  
  if (existingSettings?.enabled) {
    return c.json(
      createLocalizedError('2FA_ALREADY_ENABLED', c),
      400 as ContentfulStatusCode
    );
  }
  
  // Generate TOTP secret
  const { secret, uri, qrcode } = generateTOTPSecret(user.email);
  
  // Generate recovery codes
  const recoveryCodes = await generateRecoveryCodes();
  
  // Store temporarily (not enabled yet)
  const now = new Date().toISOString();
  const settingsId = nanoid();
  
  if (existingSettings) {
    // Update existing settings
    await db.update(user2FASettings)
      .set({
        totpSecretEncrypted: secret, // In production, encrypt this
        totpBackupCodes: JSON.stringify(recoveryCodes.map(c => c.hash)),
        enabled: false,
        updatedAt: now,
      })
      .where(eq(user2FASettings.userId, userId));
  } else {
    // Create new settings
    await db.insert(user2FASettings).values({
      id: settingsId,
      userId,
      totpSecretEncrypted: secret, // In production, encrypt this
      totpBackupCodes: JSON.stringify(recoveryCodes.map(c => c.hash)),
      enabled: false,
      createdAt: now,
      updatedAt: now,
    });
  }
  
  // Store recovery codes in separate table
  await db.delete(twoFactorRecoveryCodes)
    .where(eq(twoFactorRecoveryCodes.userId, userId));
  
  for (const code of recoveryCodes) {
    await db.insert(twoFactorRecoveryCodes).values({
      id: nanoid(),
      userId,
      codeHash: code.hash,
      used: false,
      createdAt: now,
    });
  }
  
  return c.json({
    qrcode: uri,
    secret,
    recoveryCodes: recoveryCodes.map(c => c.plain),
  });
});

// POST /2fa/verify - Verify TOTP code and enable 2FA
app.post('/verify', zValidator('json', verifyTOTPSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId')!;
  const { code } = c.req.valid('json');
  
  // Get user's 2FA settings
  const settings = await db.select()
    .from(user2FASettings)
    .where(eq(user2FASettings.userId, userId))
    .get();
  
  if (!settings) {
    return c.json(
      createLocalizedError('2FA_NOT_SETUP', c),
      400 as ContentfulStatusCode
    );
  }
  
  if (settings.enabled) {
    return c.json(
      createLocalizedError('2FA_ALREADY_ENABLED', c),
      400 as ContentfulStatusCode
    );
  }
  
  // Verify the TOTP code
  const isValid = verifyTOTPCode(settings.totpSecretEncrypted, code);
  
  if (!isValid) {
    return c.json(
      createLocalizedError('INVALID_2FA_CODE', c),
      400 as ContentfulStatusCode
    );
  }
  
  // Enable 2FA
  const now = new Date().toISOString();
  await db.update(user2FASettings)
    .set({
      enabled: true,
      enabledAt: now,
      lastUsedAt: now,
      updatedAt: now,
    })
    .where(eq(user2FASettings.userId, userId));
  
  return c.json({
    success: true,
    message: '2FA has been successfully enabled',
  });
});

// POST /2fa/disable - Disable 2FA
app.post('/disable', zValidator('json', disableTOTPSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId')!;
  const { password } = c.req.valid('json');
  
  // Verify user's password first
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) {
    return c.json(
      createLocalizedError('USER_NOT_FOUND', c),
      404 as ContentfulStatusCode
    );
  }
  
  // Import verifyPassword here to avoid circular dependency
  const { verifyPassword } = await import('../utils/auth');
  const validPassword = await verifyPassword(password, user.password!);
  if (!validPassword) {
    return c.json(
      createLocalizedError('AUTHENTICATION_FAILED', c),
      StatusCodes.AUTHENTICATION_FAILED as ContentfulStatusCode
    );
  }
  
  // Get user's 2FA settings
  const settings = await db.select()
    .from(user2FASettings)
    .where(eq(user2FASettings.userId, userId))
    .get();
  
  if (!settings || !settings.enabled) {
    return c.json(
      createLocalizedError('2FA_NOT_ENABLED', c),
      400 as ContentfulStatusCode
    );
  }
  
  // Disable 2FA
  await db.update(user2FASettings)
    .set({
      enabled: false,
      enabledAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(user2FASettings.userId, userId));
  
  // Delete recovery codes
  await db.delete(twoFactorRecoveryCodes)
    .where(eq(twoFactorRecoveryCodes.userId, userId));
  
  return c.json({
    success: true,
    message: '2FA has been successfully disabled',
  });
});

// POST /2fa/regenerate-recovery-codes - Regenerate recovery codes
app.post('/regenerate-recovery-codes', zValidator('json', enableTOTPSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId')!;
  const { password } = c.req.valid('json');
  
  // Verify user's password first
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) {
    return c.json(
      createLocalizedError('USER_NOT_FOUND', c),
      404 as ContentfulStatusCode
    );
  }
  
  // Import verifyPassword here to avoid circular dependency
  const { verifyPassword } = await import('../utils/auth');
  const validPassword = await verifyPassword(password, user.password!);
  if (!validPassword) {
    return c.json(
      createLocalizedError('AUTHENTICATION_FAILED', c),
      StatusCodes.AUTHENTICATION_FAILED as ContentfulStatusCode
    );
  }
  
  // Check if 2FA is enabled
  const settings = await db.select()
    .from(user2FASettings)
    .where(eq(user2FASettings.userId, userId))
    .get();
  
  if (!settings || !settings.enabled) {
    return c.json(
      createLocalizedError('2FA_NOT_ENABLED', c),
      400 as ContentfulStatusCode
    );
  }
  
  // Generate new recovery codes
  const recoveryCodes = await generateRecoveryCodes();
  
  // Update settings with new codes
  await db.update(user2FASettings)
    .set({
      totpBackupCodes: JSON.stringify(recoveryCodes.map(c => c.hash)),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(user2FASettings.userId, userId));
  
  // Delete old recovery codes and insert new ones
  await db.delete(twoFactorRecoveryCodes)
    .where(eq(twoFactorRecoveryCodes.userId, userId));
  
  const now = new Date().toISOString();
  for (const code of recoveryCodes) {
    await db.insert(twoFactorRecoveryCodes).values({
      id: nanoid(),
      userId,
      codeHash: code.hash,
      used: false,
      createdAt: now,
    });
  }
  
  return c.json({
    recoveryCodes: recoveryCodes.map(c => c.plain),
  });
});

export default app;