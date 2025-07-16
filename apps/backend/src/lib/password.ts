import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  // First try bcrypt (new hashes)
  try {
    // Check if it's a bcrypt hash (starts with $2)
    if (hash.startsWith('$2')) {
      return await bcrypt.compare(password, hash);
    }
    
    // For migration purposes, you can add logic here to handle old hashes
    // For now, we'll just use bcrypt
    return false;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Helper to check if a hash needs migration
export function needsPasswordMigration(hash: string): boolean {
  // Bcrypt hashes start with $2
  return !hash.startsWith('$2');
}