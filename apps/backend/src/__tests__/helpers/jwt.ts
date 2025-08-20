/**
 * JWT test helper utilities
 * Provides reusable functions for creating test tokens
 */

import * as jwt from '@tsndr/cloudflare-worker-jwt';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../../config/constants';

/**
 * Creates a signed access token for testing
 * @param userId - The user ID to include in the token
 * @param secret - The JWT secret to sign with
 * @returns A signed JWT access token
 */
export async function signTestAccessToken(userId: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: userId,
      type: 'access',
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRY
    },
    secret
  );
}

/**
 * Creates a signed refresh token for testing
 * @param userId - The user ID to include in the token
 * @param secret - The JWT secret to sign with
 * @returns A signed JWT refresh token
 */
export async function signTestRefreshToken(userId: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: userId,
      type: 'refresh',
      iat: now,
      exp: now + REFRESH_TOKEN_EXPIRY,
      jti: crypto.randomUUID()
    },
    secret
  );
}

/**
 * Creates an expired access token for testing
 * @param userId - The user ID to include in the token
 * @param secret - The JWT secret to sign with
 * @returns A signed but expired JWT access token
 */
export async function signExpiredAccessToken(userId: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: userId,
      type: 'access',
      iat: now - 3600,
      exp: now - 1800 // Expired 30 minutes ago
    },
    secret
  );
}