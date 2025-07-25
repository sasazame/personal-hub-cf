// Spring Boot compatible response formatters

export interface SpringBootError {
  code: string;
  message: string;
  details: Record<string, any> | null;
  timestamp: string;
}

export interface SpringBootAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    weekStartDay: number | null;
    createdAt: string;
    updatedAt: string;
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details: Record<string, any> | null = null
): SpringBootError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}

export function createAuthResponse(
  user: any,
  accessToken: string,
  refreshToken: string
): SpringBootAuthResponse {
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      weekStartDay: user.weekStartDay || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  };
}

// Error code mappings
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  USER_EXISTS: 'USER_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};