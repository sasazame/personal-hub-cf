import { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Bindings, Variables } from '../types';
import { nanoid } from '../utils/nanoid';
import { createHash } from '../utils/crypto';
import { createErrorResponse, ErrorCodes, StatusCodes } from '../utils/spring-boot-compat';

const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_HEADER = 'X-CSRF-Token';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const EXCLUDED_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/oidc',
];

function generateCSRFToken(): string {
  return nanoid();
}

export async function csrfMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const method = c.req.method;
  const path = c.req.path;

  // Skip CSRF check for safe methods
  if (SAFE_METHODS.includes(method)) {
    return next();
  }

  // Skip CSRF check for excluded paths (public auth endpoints)
  if (EXCLUDED_PATHS.some(excludedPath => path.startsWith(excludedPath))) {
    return next();
  }

  // Get CSRF token from cookie
  const cookieToken = getCookie(c, CSRF_TOKEN_COOKIE);
  
  // Get CSRF token from header
  const headerToken = c.req.header(CSRF_HEADER);

  // Validate CSRF token
  if (!cookieToken || !headerToken) {
    return c.json(
      createErrorResponse(ErrorCodes.FORBIDDEN, 'CSRF token missing'),
      StatusCodes.FORBIDDEN as ContentfulStatusCode
    );
  }

  // Compare tokens (use timing-safe comparison)
  const cookieHash = await createHash(cookieToken);
  const headerHash = await createHash(headerToken);
  
  if (cookieHash !== headerHash) {
    return c.json(
      createErrorResponse(ErrorCodes.FORBIDDEN, 'CSRF token invalid'),
      StatusCodes.FORBIDDEN as ContentfulStatusCode
    );
  }

  return next();
}

export function setCSRFCookie(c: Context, token: string) {
  const isProduction = c.env?.ENVIRONMENT === 'production';
  setCookie(c, CSRF_TOKEN_COOKIE, token, {
    httpOnly: false, // Must be accessible by JavaScript to read and send in header
    secure: isProduction,
    sameSite: isProduction ? 'Strict' : 'Lax', // Use Lax for development/testing
    path: '/',
    maxAge: 86400, // 24 hours
  });
}

export function generateAndSetCSRFToken(c: Context): string {
  const token = generateCSRFToken();
  setCSRFCookie(c, token);
  return token;
}