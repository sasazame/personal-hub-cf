import { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { verifyToken } from '../utils/auth';
import { createErrorResponse, ErrorCodes, StatusCodes } from '../utils/spring-boot-compat';

export async function authMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Missing or invalid authorization header'),
      StatusCodes.UNAUTHORIZED
    );
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = await verifyToken(token, c.env.JWT_SECRET);
    
    if (decoded.type !== 'access') {
      return c.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Invalid token type'),
        StatusCodes.UNAUTHORIZED
      );
    }
    
    const db = c.get('db');
    const user = await db.select()
      .from(users)
      .where(eq(users.id, decoded.sub))
      .get();
    
    if (!user || !user.enabled) {
      return c.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'User not found or disabled'),
        StatusCodes.UNAUTHORIZED
      );
    }
    
    // Set userId in context for use in routes
    c.set('userId', user.id);
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Invalid or expired token'),
      StatusCodes.UNAUTHORIZED
    );
  }
}