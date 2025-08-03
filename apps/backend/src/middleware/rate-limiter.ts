import type { Context, Next } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Bindings, Variables } from '../types';
import { createErrorResponse, ErrorCodes, StatusCodes } from '../utils/spring-boot-compat';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (c: Context<{ Bindings: Bindings; Variables: Variables }>) => string;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    keyGenerator = (c) => c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    const namespace = c.env.RATE_LIMITER;
    const key = `rate-limit:${keyGenerator(c)}`;
    const now = Date.now();
    const resetTime = now + windowMs;

    try {
      // Get current rate limit data from KV
      const data = await namespace.get(key, { type: 'json' }) as RateLimitStore[string] | null;
      
      let count = 0;
      let currentResetTime = resetTime;

      if (data) {
        // Check if window has expired
        if (data.resetTime > now) {
          count = data.count;
          currentResetTime = data.resetTime;
        }
      }

      // Check if limit exceeded
      if (count >= max) {
        const retryAfter = Math.ceil((currentResetTime - now) / 1000);
        c.header('X-RateLimit-Limit', max.toString());
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', new Date(currentResetTime).toISOString());
        c.header('Retry-After', retryAfter.toString());

        return c.json(
          createErrorResponse(
            ErrorCodes.RATE_LIMIT_EXCEEDED,
            message,
            { path: c.req.url }
          ),
          StatusCodes.TOO_MANY_REQUESTS as ContentfulStatusCode
        );
      }

      // Increment counter
      count++;

      // Set rate limit headers
      c.header('X-RateLimit-Limit', max.toString());
      c.header('X-RateLimit-Remaining', (max - count).toString());
      c.header('X-RateLimit-Reset', new Date(currentResetTime).toISOString());

      // Store updated count (do this before processing request)
      await namespace.put(
        key,
        JSON.stringify({ count, resetTime: currentResetTime }),
        { expirationTtl: Math.ceil(windowMs / 1000) }
      );

      // Process request
      await next();

      // Handle skip options after request processing
      const status = c.res.status;
      const isSuccessful = status >= 200 && status < 300;
      
      if ((skipSuccessfulRequests && isSuccessful) || (skipFailedRequests && !isSuccessful)) {
        // Decrement the counter
        count--;
        if (count > 0) {
          await namespace.put(
            key,
            JSON.stringify({ count, resetTime: currentResetTime }),
            { expirationTtl: Math.ceil(windowMs / 1000) }
          );
        } else {
          await namespace.delete(key);
        }
      }
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request to proceed
      await next();
    }
  };
}

// Preset rate limiters for common use cases
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Only count failed attempts
});

export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Rate limit exceeded. Please wait before making another request.',
});