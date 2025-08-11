import * as OTPAuth from 'otpauth';
import { nanoid } from './nanoid';
import { createHash } from './crypto';

// Generate a TOTP secret for a user
export function generateTOTPSecret(email: string, issuer = 'Personal Hub'): {
  secret: string;
  uri: string;
  qrcode: string;
} {
  // Generate a random secret
  const secret = new OTPAuth.Secret({ size: 20 });
  
  // Create TOTP instance
  const totp = new OTPAuth.TOTP({
    issuer,
    label: email,
    algorithm: 'SHA256',
    digits: 6,
    period: 30,
    secret,
  });
  
  // Generate URI for QR code
  const uri = totp.toString();
  
  return {
    secret: secret.base32,
    uri,
    qrcode: uri, // The frontend will generate QR code from this URI
  };
}

// Verify a TOTP code
export function verifyTOTPCode(secret: string, code: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      algorithm: 'SHA256',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    
    // Validate with a window of 1 (allows previous and next code)
    const delta = totp.validate({ token: code, window: 1 });
    
    // delta is null if invalid, or the time step difference if valid
    return delta !== null;
  } catch {
    return false;
  }
}

// Generate backup recovery codes
export async function generateRecoveryCodes(count = 10): Promise<{ plain: string; hash: string }[]> {
  const codes: { plain: string; hash: string }[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a random 8-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const hash = await createHash(code);
    codes.push({ plain: code, hash });
  }
  
  return codes;
}

// Verify a recovery code
export async function verifyRecoveryCode(code: string, hashedCode: string): Promise<boolean> {
  const inputHash = await createHash(code.toUpperCase());
  return inputHash === hashedCode;
}