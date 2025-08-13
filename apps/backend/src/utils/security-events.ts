import { securityEvents } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { nanoid } from './nanoid';
import { createHash } from './crypto';
import type { Context } from 'hono';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  REGISTER_SUCCESS = 'REGISTER_SUCCESS',
  REGISTER_FAILED = 'REGISTER_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  PASSWORD_RESET_FAILED = 'PASSWORD_RESET_FAILED',
  TOKEN_REFRESH_SUCCESS = 'TOKEN_REFRESH_SUCCESS',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  OAUTH_LOGIN_SUCCESS = 'OAUTH_LOGIN_SUCCESS',
  OAUTH_LOGIN_FAILED = 'OAUTH_LOGIN_FAILED',
  ACCOUNT_DISABLED_LOGIN = 'ACCOUNT_DISABLED_LOGIN',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN_ACCESS = 'INVALID_TOKEN_ACCESS',
  CSRF_TOKEN_MISMATCH = 'CSRF_TOKEN_MISMATCH',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS'
}

interface SecurityEventOptions {
  eventType: SecurityEventType;
  userId?: string | null;
  clientId?: string | null;
  success: boolean;
  errorCode?: string | null;
  errorDescription?: string | null;
  metadata?: Record<string, unknown>;
}

function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  return ipv6Regex.test(ip);
}

function getClientIpAddress(c: Context<{ Bindings: Bindings; Variables: Variables }>): string {
  const cfHeader = c.req.header('CF-Connecting-IP');
  const xForwardedFor = c.req.header('X-Forwarded-For');
  const xRealIp = c.req.header('X-Real-IP');
  
  let ip = '0.0.0.0';
  
  if (cfHeader && isValidIP(cfHeader)) {
    ip = cfHeader;
  } else if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0].trim();
    if (isValidIP(firstIp)) ip = firstIp;
  } else if (xRealIp && isValidIP(xRealIp)) {
    ip = xRealIp;
  }
  
  return ip;
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return 'invalid-email';
  
  const maskedLocal = localPart.length > 2 
    ? localPart.substring(0, 2) + '***'
    : '***';
  
  return `${maskedLocal}@${domain}`;
}

export async function logSecurityEvent(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  db: DrizzleD1Database<Record<string, unknown>>,
  options: SecurityEventOptions
): Promise<void> {
  try {
    const ipAddress = getClientIpAddress(c);
    const userAgent = c.req.header('User-Agent') || null;
    const now = new Date().toISOString();
    
    const eventData = {
      id: nanoid(),
      eventType: options.eventType,
      userId: options.userId || null,
      clientId: options.clientId || null,
      ipAddress,
      userAgent,
      success: options.success,
      errorCode: options.errorCode || null,
      errorDescription: options.errorDescription || null,
      metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      createdAt: now
    };
    
    await db.insert(securityEvents).values(eventData);
  } catch (error) {
    console.error('Critical: Failed to log security event:', {
      eventType: options.eventType,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      userId: options.userId,
      ipAddress: getClientIpAddress(c)
    });
  }
}

export function createSecurityEventLogger(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  db: DrizzleD1Database<Record<string, unknown>>
) {
  return {
    loginSuccess: async (userId: string, metadata?: Record<string, unknown>) => {
      // If metadata contains email, hash it
      if (metadata?.email && typeof metadata.email === 'string') {
        const email = metadata.email as string;
        const emailHash = await createHash(email);
        metadata = {
          ...metadata,
          email: undefined,
          emailHash,
          emailDomain: email.split('@')[1] || 'unknown'
        };
      }
      return logSecurityEvent(c, db, {
        eventType: SecurityEventType.LOGIN_SUCCESS,
        userId,
        success: true,
        metadata
      });
    },
    
    loginFailed: async (email: string, errorCode: string, errorDescription?: string) => {
      const emailHash = await createHash(email);
      return logSecurityEvent(c, db, {
        eventType: SecurityEventType.LOGIN_FAILED,
        success: false,
        errorCode,
        errorDescription,
        metadata: { 
          emailHash,
          emailDomain: email.split('@')[1] || 'unknown',
          maskedEmail: maskEmail(email)
        }
      });
    },
    
    registerSuccess: async (userId: string, email: string) => {
      const emailHash = await createHash(email);
      return logSecurityEvent(c, db, {
        eventType: SecurityEventType.REGISTER_SUCCESS,
        userId,
        success: true,
        metadata: { 
          emailHash,
          emailDomain: email.split('@')[1] || 'unknown'
        }
      });
    },
    
    registerFailed: async (email: string, errorCode: string, errorDescription?: string) => {
      const emailHash = await createHash(email);
      return logSecurityEvent(c, db, {
        eventType: SecurityEventType.REGISTER_FAILED,
        success: false,
        errorCode,
        errorDescription,
        metadata: { 
          emailHash,
          emailDomain: email.split('@')[1] || 'unknown',
          maskedEmail: maskEmail(email)
        }
      });
    },
    
    logout: (userId?: string) =>
      logSecurityEvent(c, db, {
        eventType: SecurityEventType.LOGOUT,
        userId,
        success: true
      }),
    
    passwordResetRequest: async (email: string, userExists: boolean) => {
      const emailHash = await createHash(email);
      return logSecurityEvent(c, db, {
        eventType: SecurityEventType.PASSWORD_RESET_REQUEST,
        success: true,
        metadata: { 
          emailHash,
          emailDomain: email.split('@')[1] || 'unknown',
          userExists 
        }
      });
    },
    
    passwordResetSuccess: (userId: string) =>
      logSecurityEvent(c, db, {
        eventType: SecurityEventType.PASSWORD_RESET_SUCCESS,
        userId,
        success: true
      }),
    
    passwordResetFailed: (errorCode: string, errorDescription?: string) =>
      logSecurityEvent(c, db, {
        eventType: SecurityEventType.PASSWORD_RESET_FAILED,
        success: false,
        errorCode,
        errorDescription
      }),
    
    tokenRefreshSuccess: (userId: string) =>
      logSecurityEvent(c, db, {
        eventType: SecurityEventType.TOKEN_REFRESH_SUCCESS,
        userId,
        success: true
      }),
    
    tokenRefreshFailed: (errorCode: string, errorDescription?: string) =>
      logSecurityEvent(c, db, {
        eventType: SecurityEventType.TOKEN_REFRESH_FAILED,
        success: false,
        errorCode,
        errorDescription
      }),
    
    accountDisabledLogin: async (userId: string, email: string) => {
      const emailHash = await createHash(email);
      return logSecurityEvent(c, db, {
        eventType: SecurityEventType.ACCOUNT_DISABLED_LOGIN,
        userId,
        success: false,
        errorCode: 'ACCOUNT_DISABLED',
        metadata: { 
          emailHash,
          emailDomain: email.split('@')[1] || 'unknown'
        }
      });
    },
    
    suspiciousActivity: async (description: string, metadata?: Record<string, unknown>) => {
      // If metadata contains sensitive data, hash it
      if (metadata?.email && typeof metadata.email === 'string') {
        const email = metadata.email as string;
        const emailHash = await createHash(email);
        metadata = {
          ...metadata,
          email: undefined,
          emailHash,
          emailDomain: email.split('@')[1] || 'unknown'
        };
      }
      if (metadata?.newEmail && typeof metadata.newEmail === 'string') {
        const newEmail = metadata.newEmail as string;
        const newEmailHash = await createHash(newEmail);
        metadata = {
          ...metadata,
          newEmail: undefined,
          newEmailHash,
          newEmailDomain: newEmail.split('@')[1] || 'unknown'
        };
      }
      return logSecurityEvent(c, db, {
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        success: false,
        errorDescription: description,
        metadata
      });
    },
    
    rateLimitExceeded: (endpoint: string, metadata?: Record<string, unknown>) =>
      logSecurityEvent(c, db, {
        eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
        success: false,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        metadata: { endpoint, ...metadata }
      }),
    
    invalidTokenAccess: (errorDescription?: string) =>
      logSecurityEvent(c, db, {
        eventType: SecurityEventType.INVALID_TOKEN_ACCESS,
        success: false,
        errorCode: 'INVALID_TOKEN',
        errorDescription
      }),
    
    csrfTokenMismatch: (metadata?: Record<string, unknown>) =>
      logSecurityEvent(c, db, {
        eventType: SecurityEventType.CSRF_TOKEN_MISMATCH,
        success: false,
        errorCode: 'CSRF_TOKEN_MISMATCH',
        metadata
      }),
    
    unauthorizedAccess: (endpoint: string, userId?: string) =>
      logSecurityEvent(c, db, {
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
        userId,
        success: false,
        errorCode: 'UNAUTHORIZED',
        metadata: { endpoint }
      })
  };
}