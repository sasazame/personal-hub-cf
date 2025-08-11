import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as OTPAuth from 'otpauth';
import { generateTOTPSecret, verifyTOTPCode, generateRecoveryCodes, verifyRecoveryCode } from '../../utils/totp';
import { nanoid } from '../../utils/nanoid';
import { createHash } from '../../utils/crypto';

// Mock dependencies
vi.mock('otpauth');
vi.mock('../../utils/nanoid');
vi.mock('../../utils/crypto');

describe('TOTP Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateTOTPSecret', () => {
    it('should generate a TOTP secret with default issuer', () => {
      const mockSecret = {
        base32: 'MOCK_SECRET_BASE32',
      };
      const mockTOTP = {
        toString: vi.fn().mockReturnValue('otpauth://totp/test'),
      };

      vi.spyOn(OTPAuth, 'Secret').mockImplementation(() => mockSecret as any);
      vi.spyOn(OTPAuth, 'TOTP').mockImplementation(() => mockTOTP as any);

      const result = generateTOTPSecret('test@example.com');

      expect(result).toEqual({
        secret: 'MOCK_SECRET_BASE32',
        uri: 'otpauth://totp/test',
        qrcode: 'otpauth://totp/test',
      });

      expect(OTPAuth.TOTP).toHaveBeenCalledWith({
        issuer: 'Personal Hub',
        label: 'test@example.com',
        algorithm: 'SHA256',
        digits: 6,
        period: 30,
        secret: mockSecret,
      });
    });

    it('should generate a TOTP secret with custom issuer', () => {
      const mockSecret = {
        base32: 'MOCK_SECRET_BASE32',
      };
      const mockTOTP = {
        toString: vi.fn().mockReturnValue('otpauth://totp/custom'),
      };

      vi.spyOn(OTPAuth, 'Secret').mockImplementation(() => mockSecret as any);
      vi.spyOn(OTPAuth, 'TOTP').mockImplementation(() => mockTOTP as any);

      const result = generateTOTPSecret('test@example.com', 'Custom App');

      expect(result).toEqual({
        secret: 'MOCK_SECRET_BASE32',
        uri: 'otpauth://totp/custom',
        qrcode: 'otpauth://totp/custom',
      });

      expect(OTPAuth.TOTP).toHaveBeenCalledWith({
        issuer: 'Custom App',
        label: 'test@example.com',
        algorithm: 'SHA256',
        digits: 6,
        period: 30,
        secret: mockSecret,
      });
    });
  });

  describe('verifyTOTPCode', () => {
    it('should return true for valid TOTP code', () => {
      const mockTOTP = {
        validate: vi.fn().mockReturnValue(0), // 0 means current time window
      };

      vi.spyOn(OTPAuth.Secret, 'fromBase32').mockReturnValue({} as any);
      vi.spyOn(OTPAuth, 'TOTP').mockImplementation(() => mockTOTP as any);

      const result = verifyTOTPCode('SECRET_BASE32', '123456');

      expect(result).toBe(true);
      expect(mockTOTP.validate).toHaveBeenCalledWith({
        token: '123456',
        window: 1,
      });
    });

    it('should return false for invalid TOTP code', () => {
      const mockTOTP = {
        validate: vi.fn().mockReturnValue(null), // null means invalid
      };

      vi.spyOn(OTPAuth.Secret, 'fromBase32').mockReturnValue({} as any);
      vi.spyOn(OTPAuth, 'TOTP').mockImplementation(() => mockTOTP as any);

      const result = verifyTOTPCode('SECRET_BASE32', '999999');

      expect(result).toBe(false);
    });

    it('should return false when TOTP validation throws error', () => {
      vi.spyOn(OTPAuth.Secret, 'fromBase32').mockImplementation(() => {
        throw new Error('Invalid secret');
      });

      const result = verifyTOTPCode('INVALID_SECRET', '123456');

      expect(result).toBe(false);
    });

    it('should accept codes from previous and next time windows', () => {
      const mockTOTP = {
        validate: vi.fn().mockReturnValue(-1), // -1 means previous window
      };

      vi.spyOn(OTPAuth.Secret, 'fromBase32').mockReturnValue({} as any);
      vi.spyOn(OTPAuth, 'TOTP').mockImplementation(() => mockTOTP as any);

      const result = verifyTOTPCode('SECRET_BASE32', '123456');

      expect(result).toBe(true);
      expect(mockTOTP.validate).toHaveBeenCalledWith({
        token: '123456',
        window: 1,
      });
    });
  });

  describe('generateRecoveryCodes', () => {
    it('should generate default number of recovery codes', async () => {
      vi.mocked(nanoid).mockImplementation(() => 'mockcode');
      vi.mocked(createHash).mockImplementation(async (input) => `hash_${input}`);

      const codes = await generateRecoveryCodes();

      expect(codes).toHaveLength(10);
      expect(codes[0]).toEqual({
        plain: 'MOCKCODE',
        hash: 'hash_MOCKCODE',
      });
      expect(nanoid).toHaveBeenCalledTimes(10);
      expect(nanoid).toHaveBeenCalledWith(8);
    });

    it('should generate custom number of recovery codes', async () => {
      vi.mocked(nanoid).mockImplementation(() => 'testcode');
      vi.mocked(createHash).mockImplementation(async (input) => `hash_${input}`);

      const codes = await generateRecoveryCodes(5);

      expect(codes).toHaveLength(5);
      expect(codes[0]).toEqual({
        plain: 'TESTCODE',
        hash: 'hash_TESTCODE',
      });
      expect(nanoid).toHaveBeenCalledTimes(5);
    });

    it('should generate unique codes', async () => {
      let counter = 0;
      vi.mocked(nanoid).mockImplementation(() => `code${counter++}`);
      vi.mocked(createHash).mockImplementation(async (input) => `hash_${input}`);

      const codes = await generateRecoveryCodes(3);

      expect(codes).toHaveLength(3);
      expect(codes[0].plain).toBe('CODE0');
      expect(codes[1].plain).toBe('CODE1');
      expect(codes[2].plain).toBe('CODE2');
      
      // Check all codes are unique
      const uniqueCodes = new Set(codes.map(c => c.plain));
      expect(uniqueCodes.size).toBe(3);
    });
  });

  describe('verifyRecoveryCode', () => {
    it('should return true for matching recovery code', async () => {
      vi.mocked(createHash).mockResolvedValue('hash_CODE1234');

      const result = await verifyRecoveryCode('code1234', 'hash_CODE1234');

      expect(result).toBe(true);
      expect(createHash).toHaveBeenCalledWith('CODE1234');
    });

    it('should return false for non-matching recovery code', async () => {
      vi.mocked(createHash).mockResolvedValue('hash_CODE1234');

      const result = await verifyRecoveryCode('wrongcode', 'hash_CODE1234');

      expect(result).toBe(false);
      expect(createHash).toHaveBeenCalledWith('WRONGCODE');
    });

    it('should convert input to uppercase before verification', async () => {
      vi.mocked(createHash).mockResolvedValue('hash_ABCDEF');

      const result = await verifyRecoveryCode('abcdef', 'hash_ABCDEF');

      expect(result).toBe(true);
      expect(createHash).toHaveBeenCalledWith('ABCDEF');
    });

    it('should handle mixed case input', async () => {
      vi.mocked(createHash).mockResolvedValue('hash_ABC123');

      const result = await verifyRecoveryCode('aBc123', 'hash_ABC123');

      expect(result).toBe(true);
      expect(createHash).toHaveBeenCalledWith('ABC123');
    });
  });
});