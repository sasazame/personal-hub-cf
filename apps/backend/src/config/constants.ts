/**
 * Application constants
 */

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Authentication & Session Management
/**
 * Token and session duration configuration
 * 
 * Security/UX Trade-offs:
 * - Shorter durations = Better security (less exposure window if compromised)
 * - Longer durations = Better UX (less frequent re-authentication)
 * 
 * Current implementation uses a three-tier approach:
 * 1. Access tokens (1 hour): Short-lived for API security
 * 2. Session cookies (24 hours): Medium duration with sliding window for active users
 * 3. Refresh tokens (7 days): Long-lived for persistent authentication
 * 
 * Security considerations:
 * - Access tokens are stateless JWTs, cannot be revoked individually
 * - Session cookies use httpOnly, secure, and SameSite attributes
 * - Refresh tokens are stored in DB and can be revoked
 * 
 * Future enhancements to consider:
 * - Device fingerprinting for additional session validation
 * - IP validation for high-security operations
 * - Adaptive session timeout based on user activity patterns
 * - Different durations for different security contexts (admin vs regular users)
 */
export const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hour (in seconds)
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days (in seconds)
export const SESSION_COOKIE_EXPIRY = 24 * 60 * 60; // 24 hours (in seconds)

// Password reset token expiry
export const PASSWORD_RESET_TOKEN_EXPIRY = 60 * 60; // 1 hour (in seconds)

// Password requirements
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Username requirements
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

// Rate limiting
export const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute (in milliseconds)
export const RATE_LIMIT_MAX_REQUESTS = 100;
export const AUTH_RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes (in milliseconds)
export const STRICT_RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour (in milliseconds)

// File size limits
export const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_JSON_SIZE = 1024 * 1024; // 1MB

// Pomodoro defaults
export const DEFAULT_WORK_DURATION = 25;
export const DEFAULT_SHORT_BREAK = 5;
export const DEFAULT_LONG_BREAK = 15;
export const DEFAULT_CYCLES_BEFORE_LONG_BREAK = 4;

// Default tags
export const DEFAULT_MOMENT_TAGS = [
  'insight',
  'idea',
  'reflection',
  'gratitude',
  'achievement',
  'learning',
  'challenge',
  'motivation'
];