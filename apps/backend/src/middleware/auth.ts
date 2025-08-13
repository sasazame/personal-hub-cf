import { Context, Next } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { verifyToken } from '../utils/auth';
import { createErrorResponse, ErrorCodes, StatusCodes } from '../utils/spring-boot-compat';
import { createSecurityEventLogger } from '../utils/security-events';

// Cookie names (matching auth.ts)
const ACCESS_TOKEN_COOKIE = 'access-token';
const SESSION_COOKIE = 'session-id';

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

interface SessionData {
  lastActivity: number;
  userId: string | null;
}

export async function authMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const db = c.get('db');
  const securityLogger = createSecurityEventLogger(c, db);
  const endpoint = c.req.url;
  
  // Check session timeout first
  const sessionCookie = getCookie(c, SESSION_COOKIE);
  if (sessionCookie) {
    try {
      const session: SessionData = JSON.parse(sessionCookie);
      if (Date.now() - session.lastActivity > SESSION_TIMEOUT) {
        // Session expired, clear all cookies
        const isProduction = c.env?.ENVIRONMENT === 'production';
        const sameSite = isProduction ? 'None' : 'Lax';
        
        setCookie(c, ACCESS_TOKEN_COOKIE, '', { maxAge: 0, path: '/' });
        setCookie(c, SESSION_COOKIE, '', { maxAge: 0, path: '/' });
        
        // Also delete cookies for better compatibility
        deleteCookie(c, ACCESS_TOKEN_COOKIE, { 
          path: '/',
          secure: isProduction,
          sameSite: sameSite as 'None' | 'Lax'
        });
        deleteCookie(c, SESSION_COOKIE, { 
          path: '/',
          secure: isProduction,
          sameSite: sameSite as 'None' | 'Lax'
        });
        
        await securityLogger.unauthorizedAccess(endpoint, session.userId || undefined);
        return c.json(
          createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Session expired'),
          StatusCodes.UNAUTHORIZED as ContentfulStatusCode
        );
      }
      
      // Update session activity
      const updatedSession: SessionData = { ...session, lastActivity: Date.now() };
      setCookie(c, SESSION_COOKIE, JSON.stringify(updatedSession), {
        httpOnly: true,
        secure: c.env?.ENVIRONMENT === 'production',
        sameSite: c.env?.ENVIRONMENT === 'production' ? 'None' : 'Lax',
        path: '/',
        maxAge: 30 * 60,
      });
    } catch {
      // Invalid session cookie, continue without session check
    }
  }
  
  // Try to get token from cookie first, then fall back to header for backwards compatibility
  let token = getCookie(c, ACCESS_TOKEN_COOKIE);
  
  if (!token) {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      await securityLogger.unauthorizedAccess(endpoint);
      return c.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Missing or invalid authorization'),
        StatusCodes.UNAUTHORIZED as ContentfulStatusCode
      );
    }
    token = authHeader.substring(7);
  }
  
  try {
    const decoded = await verifyToken(token, c.env.JWT_SECRET);
    
    if (decoded.type !== 'access') {
      await securityLogger.invalidTokenAccess('Invalid token type');
      return c.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Invalid token type'),
        401
      );
    }
    
    const user = await db.select()
      .from(users)
      .where(eq(users.id, decoded.sub as string))
      .get();
    
    if (!user || !user.enabled) {
      await securityLogger.unauthorizedAccess(endpoint, decoded.sub as string);
      return c.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'User not found or disabled'),
        401
      );
    }
    
    // Set userId in context for use in routes
    c.set('userId', user.id);
    
    // Update session with userId if not already set
    if (sessionCookie) {
      try {
        const session: SessionData = JSON.parse(sessionCookie);
        if (!session.userId || session.userId !== user.id) {
          session.userId = user.id;
          setCookie(c, SESSION_COOKIE, JSON.stringify(session), {
            httpOnly: true,
            secure: c.env?.ENVIRONMENT === 'production',
            sameSite: c.env?.ENVIRONMENT === 'production' ? 'None' : 'Lax',
            path: '/',
            maxAge: 30 * 60,
          });
        }
      } catch {
        // Ignore session update errors
      }
    }
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    await securityLogger.invalidTokenAccess('Invalid or expired token');
    return c.json(
      createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Invalid or expired token'),
      StatusCodes.UNAUTHORIZED as ContentfulStatusCode
    );
  }
}