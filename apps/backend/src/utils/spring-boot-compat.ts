// Spring Boot compatible response formatters with English messages

export interface SpringBootError {
  code: string;
  message: string;
  details: Record<string, unknown> | null;
  timestamp: string;
}

export interface SpringBootAuthResponse {
  accessToken: string;
  refreshToken: string;
  csrfToken?: string;
  user: {
    id: string;
    username: string;
    email: string;
    weekStartDay: number | null;
    createdAt: string;
    updatedAt: string;
  };
}

// Error codes from Spring Boot
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  USER_EXISTS: 'USER_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TODO_NOT_FOUND: 'TODO_NOT_FOUND',
  MOMENT_NOT_FOUND: 'MOMENT_NOT_FOUND',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  OAUTH2_REQUIRED: 'OAUTH2_REQUIRED',
  DUPLICATE_AUTH_CODE: 'DUPLICATE_AUTH_CODE',
  TOKEN_DECRYPTION_FAILED: 'TOKEN_DECRYPTION_FAILED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  CONFLICT: 'CONFLICT'
};

// English error messages (replacing Japanese messages from Spring Boot)
export const ErrorMessages = {
  VALIDATION_ERROR: 'Invalid input', // 入力値が不正です
  AUTHENTICATION_FAILED: 'Authentication failed', // 認証に失敗しました
  UNAUTHORIZED: 'Unauthorized',
  USER_EXISTS: 'This email address is already in use', // このメールアドレスは既に使用されています
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  FORBIDDEN: 'Access denied', // アクセス権限がありません
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Server error occurred', // サーバーエラーが発生しました
  INVALID_JSON: 'Invalid request format', // リクエストの形式が不正です
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  TODO_NOT_FOUND: 'TODO not found',
  MOMENT_NOT_FOUND: 'Moment not found',
  INVALID_PARAMETER: 'Invalid parameter',
  EMAIL_ALREADY_EXISTS: 'This email address is already in use',
  OAUTH2_REQUIRED: 'OAuth2 authentication required',
  DUPLICATE_AUTH_CODE: 'The authorization code has already been used. Please try logging in again.',
  TOKEN_DECRYPTION_FAILED: 'Your authentication tokens could not be decrypted. Please re-authenticate with Google.',
  CONFLICT: 'Resource already exists'
};

// Validation messages (English version of Spring Boot messages)
export const ValidationMessages = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Email should be valid',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_WEAK: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_INVALID: 'Username must be between 3 and 20 characters'
};

export function createErrorResponse(
  code: string,
  message?: string,
  details: Record<string, unknown> | null = null
): SpringBootError {
  return {
    code,
    message: message || ErrorMessages[code as keyof typeof ErrorMessages] || 'Unknown error',
    details,
    timestamp: new Date().toISOString()
  };
}

export function createValidationError(fieldErrors: Record<string, string>): SpringBootError {
  return createErrorResponse(
    ErrorCodes.VALIDATION_ERROR,
    ErrorMessages.VALIDATION_ERROR,
    fieldErrors
  );
}

export function createAuthResponse(
  user: {
    id: string;
    username: string;
    email: string;
    week_start_day?: number | null;
    weekStartDay?: number | null;
    created_at?: string;
    createdAt?: string;
    updated_at?: string;
    updatedAt?: string;
  },
  accessToken: string,
  refreshToken: string,
  csrfToken?: string
): SpringBootAuthResponse {
  return {
    accessToken,
    refreshToken,
    ...(csrfToken && { csrfToken }),
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      weekStartDay: user.week_start_day || user.weekStartDay || null,
      createdAt: user.created_at || user.createdAt || new Date().toISOString(),
      updatedAt: user.updated_at || user.updatedAt || new Date().toISOString()
    }
  };
}

// Status code mappings to match Spring Boot
export const StatusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 400,
  AUTHENTICATION_FAILED: 401,
  UNAUTHORIZED: 401,
  USER_EXISTS: 409, // Spring Boot returns 409 for duplicate user
  USER_NOT_FOUND: 500, // Spring Boot returns 500 for user not found during login
  INVALID_CREDENTIALS: 401,
  INVALID_TOKEN: 401,
  TOKEN_EXPIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  INVALID_JSON: 400,
  RATE_LIMIT_EXCEEDED: 429,
  TOO_MANY_REQUESTS: 429
};