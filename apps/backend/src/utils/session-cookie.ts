/**
 * Session cookie signing and verification utilities
 * Provides HMAC-based signing to prevent client-side tampering
 */

import { SESSION_COOKIE_EXPIRY } from '../config/constants';

/**
 * Creates an HMAC signature for session data
 * @param data - The session data to sign
 * @param secret - The secret key for signing
 * @returns The HMAC signature as a hex string
 */
async function createSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifies an HMAC signature
 * @param data - The data to verify
 * @param signature - The signature to verify against
 * @param secret - The secret key used for signing
 * @returns True if the signature is valid
 */
async function verifySignature(data: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await createSignature(data, secret);
  return signature === expectedSignature;
}

/**
 * Session data structure
 */
export interface SessionData {
  lastActivity: number;
  userId?: string | null;
}

/**
 * Creates a signed session cookie value
 * @param data - The session data
 * @param secret - The secret key for signing
 * @returns The signed cookie value
 */
export async function createSignedSessionCookie(
  data: SessionData,
  secret: string
): Promise<string> {
  const payload = JSON.stringify(data);
  const signature = await createSignature(payload, secret);
  // Format: payload.signature
  return `${Buffer.from(payload).toString('base64')}.${signature}`;
}

/**
 * Parses and verifies a signed session cookie
 * @param cookieValue - The signed cookie value
 * @param secret - The secret key for verification
 * @returns The session data if valid, null otherwise
 */
export async function parseSignedSessionCookie(
  cookieValue: string,
  secret: string
): Promise<SessionData | null> {
  try {
    const [encodedPayload, signature] = cookieValue.split('.');
    if (!encodedPayload || !signature) {
      return null;
    }
    
    const payload = Buffer.from(encodedPayload, 'base64').toString();
    const isValid = await verifySignature(payload, signature, secret);
    
    if (!isValid) {
      return null;
    }
    
    return JSON.parse(payload) as SessionData;
  } catch {
    // Invalid format or JSON
    return null;
  }
}

/**
 * Cookie options for session cookies
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true, // Always use secure in production
  sameSite: 'lax' as const,
  maxAge: SESSION_COOKIE_EXPIRY, // maxAge expects seconds
  path: '/'
};

/**
 * Gets environment-specific cookie options
 * @param isProduction - Whether running in production
 * @returns Cookie options adjusted for the environment
 */
export function getSessionCookieOptions(isProduction: boolean) {
  return {
    ...SESSION_COOKIE_OPTIONS,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const
  };
}