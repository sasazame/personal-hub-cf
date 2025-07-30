import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateTokens, verifyToken } from '../../utils/auth';

describe('Auth Utils', () => {
  describe('Password Hashing', () => {
    it('should hash password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).toContain(':'); // Should contain salt:hash format
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should handle invalid hash format', async () => {
      const password = 'TestPassword123!';
      const invalidHash = 'invalid-hash-format';
      
      const isValid = await verifyPassword(password, invalidHash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token', () => {
    const mockSecret = 'test-jwt-secret-for-unit-tests';

    it('should generate both access and refresh tokens', async () => {
      const userId = 'test-user-123';
      const tokens = await generateTokens(userId, mockSecret);
      
      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.accessToken.split('.')).toHaveLength(3); // JWT format
      expect(tokens.refreshToken.split('.')).toHaveLength(3);
    });

    it('should verify valid access token', async () => {
      const userId = 'test-user-123';
      const tokens = await generateTokens(userId, mockSecret);
      
      const payload = await verifyToken(tokens.accessToken, mockSecret);
      expect(payload).toBeDefined();
      expect(payload.sub).toBe(userId);
      expect(payload.type).toBe('access');
    });

    it('should verify valid refresh token', async () => {
      const userId = 'test-user-123';
      const tokens = await generateTokens(userId, mockSecret);
      
      const payload = await verifyToken(tokens.refreshToken, mockSecret);
      expect(payload).toBeDefined();
      expect(payload.sub).toBe(userId);
      expect(payload.type).toBe('refresh');
    });

    it('should reject invalid token', async () => {
      const invalidToken = 'invalid.jwt.token';
      
      await expect(verifyToken(invalidToken, mockSecret)).rejects.toThrow();
    });

    it('should reject token with wrong secret', async () => {
      const userId = 'test-user-123';
      const tokens = await generateTokens(userId, mockSecret);
      
      const wrongSecret = 'wrong-secret';
      await expect(verifyToken(tokens.accessToken, wrongSecret)).rejects.toThrow();
    });

    it('should include proper claims in access token', async () => {
      const userId = 'test-user-123';
      const tokens = await generateTokens(userId, mockSecret);
      
      const payload = await verifyToken(tokens.accessToken, mockSecret);
      expect(payload).toMatchObject({
        sub: userId,
        type: 'access',
        exp: expect.any(Number),
      });
      
      // Check expiration time (should be ~15 minutes)
      const now = Math.floor(Date.now() / 1000);
      const expiry = payload.exp! - now;
      expect(expiry).toBeGreaterThan(0);
      expect(expiry).toBeLessThanOrEqual(15 * 60);
    });

    it('should include proper claims in refresh token', async () => {
      const userId = 'test-user-123';
      const tokens = await generateTokens(userId, mockSecret);
      
      const payload = await verifyToken(tokens.refreshToken, mockSecret);
      expect(payload).toMatchObject({
        sub: userId,
        type: 'refresh',
        exp: expect.any(Number),
      });
      
      // Check expiration time (should be ~7 days)
      const now = Math.floor(Date.now() / 1000);
      const expiry = payload.exp! - now;
      expect(expiry).toBeGreaterThan(0);
      expect(expiry).toBeLessThanOrEqual(7 * 24 * 60 * 60);
    });

    it('should have different expiration for access and refresh tokens', async () => {
      const userId = 'test-user-123';
      const tokens = await generateTokens(userId, mockSecret);
      
      const accessPayload = await verifyToken(tokens.accessToken, mockSecret);
      const refreshPayload = await verifyToken(tokens.refreshToken, mockSecret);
      
      expect(refreshPayload.exp!).toBeGreaterThan(accessPayload.exp!);
    });
  });
});