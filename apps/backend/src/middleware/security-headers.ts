import type { Context, Next } from 'hono';
import type { Bindings, Variables } from '../types';

export const securityHeaders = async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
  await next();
  
  // Security headers - following OWASP recommendations
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy - adjust as needed for your application
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // May need to adjust for your frontend
    "style-src 'self' 'unsafe-inline'", // May need to adjust for your styling approach
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ];
  
  c.header('Content-Security-Policy', cspDirectives.join('; '));
};