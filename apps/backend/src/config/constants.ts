/**
 * Application constants
 */

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Auth
export const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hour
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days
export const SESSION_COOKIE_EXPIRY = 24 * 60 * 60; // 24 hours

// Password requirements
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Username requirements
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

// Rate limiting
export const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 100;
export const AUTH_RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes (in milliseconds)

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