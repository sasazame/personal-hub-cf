import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import app from '../../routes/2fa';
import { authMiddleware } from '../../middleware/auth';
import { generateTOTPSecret, verifyTOTPCode, generateRecoveryCodes } from '../../utils/totp';
import { verifyPassword } from '../../utils/auth';
import { createHash } from '../../utils/crypto';
import { nanoid } from '../../utils/nanoid';
import type { Bindings, Variables } from '../../types';

// Mock dependencies
vi.mock('../../middleware/auth');
vi.mock('../../utils/totp');
vi.mock('../../utils/auth');
vi.mock('../../utils/crypto');
vi.mock('../../utils/nanoid');

describe('2FA Routes', () => {
  let testApp: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let mockDb: any;
  let mockUser: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock database
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };

    // Setup mock user
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashed_password',
      enabled: true,
    };

    // Create test app with mocked context
    testApp = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Mock auth middleware to set userId
    vi.mocked(authMiddleware).mockImplementation(async (c, next) => {
      c.set('userId', 'user-123');
      c.set('db', mockDb);
      await next();
    });

    // Mount the 2FA routes
    testApp.route('/2fa', app);

    // Mock nanoid
    vi.mocked(nanoid).mockReturnValue('mock-id-123');

    // Mock createHash
    vi.mocked(createHash).mockResolvedValue('hashed-value');
  });

  describe('GET /2fa/status', () => {
    it('should return 2FA disabled when no settings exist', async () => {
      mockDb.get.mockResolvedValue(null);

      const response = await testApp.request('/2fa/status', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data).toEqual({
        enabled: false,
        enabledAt: undefined,
        lastUsedAt: undefined,
      });
    });

    it('should return 2FA enabled status when settings exist', async () => {
      const mockSettings = {
        enabled: true,
        enabledAt: '2024-01-01T00:00:00Z',
        lastUsedAt: '2024-01-02T00:00:00Z',
      };
      mockDb.get.mockResolvedValue(mockSettings);

      const response = await testApp.request('/2fa/status', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data).toEqual({
        enabled: true,
        enabledAt: '2024-01-01T00:00:00Z',
        lastUsedAt: '2024-01-02T00:00:00Z',
      });
    });
  });

  describe('POST /2fa/setup', () => {
    beforeEach(() => {
      // Mock TOTP secret generation
      vi.mocked(generateTOTPSecret).mockReturnValue({
        secret: 'MOCK_SECRET_BASE32',
        uri: 'otpauth://totp/Personal%20Hub:test@example.com?secret=MOCK_SECRET_BASE32',
        qrcode: 'otpauth://totp/Personal%20Hub:test@example.com?secret=MOCK_SECRET_BASE32',
      });

      // Mock recovery codes generation
      vi.mocked(generateRecoveryCodes).mockResolvedValue([
        { plain: 'CODE1234', hash: 'hash1' },
        { plain: 'CODE5678', hash: 'hash2' },
      ]);

      // Mock password verification
      vi.mocked(verifyPassword).mockResolvedValue(true);
    });

    it('should setup 2FA successfully with correct password', async () => {
      mockDb.get.mockResolvedValueOnce(mockUser); // User lookup
      mockDb.get.mockResolvedValueOnce(null); // No existing 2FA settings

      const response = await testApp.request('/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'correct_password',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data).toHaveProperty('qrcode');
      expect(data).toHaveProperty('secret');
      expect(data).toHaveProperty('recoveryCodes');
      expect(data.recoveryCodes).toHaveLength(2);
    });

    it('should fail with incorrect password', async () => {
      mockDb.get.mockResolvedValue(mockUser);
      vi.mocked(verifyPassword).mockResolvedValue(false);

      const response = await testApp.request('/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'wrong_password',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should fail if 2FA is already enabled', async () => {
      mockDb.get.mockResolvedValueOnce(mockUser);
      mockDb.get.mockResolvedValueOnce({ enabled: true });

      const response = await testApp.request('/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'correct_password',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /2fa/verify', () => {
    beforeEach(() => {
      vi.mocked(verifyTOTPCode).mockReturnValue(true);
    });

    it('should enable 2FA with valid TOTP code', async () => {
      const mockSettings = {
        userId: 'user-123',
        totpSecretEncrypted: 'MOCK_SECRET',
        enabled: false,
      };
      mockDb.get.mockResolvedValue(mockSettings);

      const response = await testApp.request('/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: '123456',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should fail with invalid TOTP code', async () => {
      const mockSettings = {
        userId: 'user-123',
        totpSecretEncrypted: 'MOCK_SECRET',
        enabled: false,
      };
      mockDb.get.mockResolvedValue(mockSettings);
      vi.mocked(verifyTOTPCode).mockReturnValue(false);

      const response = await testApp.request('/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: '999999',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should fail if 2FA is not setup', async () => {
      mockDb.get.mockResolvedValue(null);

      const response = await testApp.request('/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: '123456',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should fail if 2FA is already enabled', async () => {
      const mockSettings = {
        userId: 'user-123',
        totpSecretEncrypted: 'MOCK_SECRET',
        enabled: true,
      };
      mockDb.get.mockResolvedValue(mockSettings);

      const response = await testApp.request('/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: '123456',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /2fa/disable', () => {
    beforeEach(() => {
      vi.mocked(verifyPassword).mockResolvedValue(true);
    });

    it('should disable 2FA with correct password', async () => {
      mockDb.get.mockResolvedValueOnce(mockUser);
      mockDb.get.mockResolvedValueOnce({ enabled: true });

      const response = await testApp.request('/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'correct_password',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should fail with incorrect password', async () => {
      mockDb.get.mockResolvedValue(mockUser);
      vi.mocked(verifyPassword).mockResolvedValue(false);

      const response = await testApp.request('/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'wrong_password',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should fail if 2FA is not enabled', async () => {
      mockDb.get.mockResolvedValueOnce(mockUser);
      mockDb.get.mockResolvedValueOnce({ enabled: false });

      const response = await testApp.request('/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'correct_password',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /2fa/regenerate-recovery-codes', () => {
    beforeEach(() => {
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(generateRecoveryCodes).mockResolvedValue([
        { plain: 'NEWCODE1', hash: 'newhash1' },
        { plain: 'NEWCODE2', hash: 'newhash2' },
      ]);
    });

    it('should regenerate recovery codes with correct password', async () => {
      mockDb.get.mockResolvedValueOnce(mockUser);
      mockDb.get.mockResolvedValueOnce({ enabled: true });

      const response = await testApp.request('/2fa/regenerate-recovery-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'correct_password',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.recoveryCodes).toHaveLength(2);
      expect(data.recoveryCodes).toContain('NEWCODE1');
      expect(data.recoveryCodes).toContain('NEWCODE2');
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should fail if 2FA is not enabled', async () => {
      mockDb.get.mockResolvedValueOnce(mockUser);
      mockDb.get.mockResolvedValueOnce({ enabled: false });

      const response = await testApp.request('/2fa/regenerate-recovery-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'correct_password',
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});