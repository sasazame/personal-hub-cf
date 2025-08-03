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
  
  // Content Security Policy - environment-aware configuration
  const isDevelopment = c.env.ENVIRONMENT === 'development';
  const cspDirectives = [
    "default-src 'self'",
    // Allow unsafe directives only in development
    isDevelopment 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" 
      : "script-src 'self'",
    isDevelopment 
      ? "style-src 'self' 'unsafe-inline'" 
      : "style-src 'self'",
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