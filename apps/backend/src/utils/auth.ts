import jwt from '@tsndr/cloudflare-worker-jwt';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../config/constants';

// Password hashing using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Import password as key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive bits using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  // Convert to hex string with salt prefix
  const hashArray = new Uint8Array(hashBuffer);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [saltHex, hashHex] = hash.split(':');
  if (!saltHex || !hashHex) return false;
  
  // Convert hex strings back to Uint8Array
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Import password as key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive bits using same parameters
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  // Compare with stored hash
  const hashArray = new Uint8Array(hashBuffer);
  const computedHashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedHashHex === hashHex;
}

// JWT functions
export async function generateTokens(userId: string, secret: string) {
  const now = Math.floor(Date.now() / 1000);
  
  const accessToken = await jwt.sign(
    { 
      sub: userId, 
      type: 'access',
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRY
    },
    secret
  );
  
  const refreshToken = await jwt.sign(
    { 
      sub: userId, 
      type: 'refresh',
      iat: now,
      exp: now + REFRESH_TOKEN_EXPIRY,
      jti: crypto.randomUUID() // Add unique identifier to prevent duplicate tokens
    },
    secret
  );
  
  return { accessToken, refreshToken };
}

interface JWTPayload {
  sub: string;
  type: 'access' | 'refresh';
  exp: number;
  iat?: number;
  jti?: string; // JWT ID for uniqueness
}

export async function verifyToken(token: string, secret: string): Promise<JWTPayload> {
  const isValid = await jwt.verify(token, secret);
  if (!isValid) {
    throw new Error('Invalid token');
  }
  
  const decoded = jwt.decode(token);
  return decoded.payload as JWTPayload;
}