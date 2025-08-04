import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import usersRoutes from '../../routes/users';
import type { Bindings, Variables } from '../../types';
import { createTestContext } from '../helpers/test-context';
import { asMockedDb } from '../helpers/mock-types';
import * as authUtils from '../../utils/auth';
import * as jwt from '@tsndr/cloudflare-worker-jwt';
import type { ErrorResponse, MessageResponse } from '../helpers/response-types';

// User-specific response types
interface UserProfileResponse {
  id: string;
  email: string;
  username: string;
  emailVerified: boolean;
  profilePictureUrl: string | null;
  givenName: string | null;
  familyName: string | null;
  locale: string | null;
  weekStartDay: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserUpdateResponse {
  id: string;
  email: string;
  username: string;
  emailVerified: boolean;
  profilePictureUrl: string | null;
  givenName: string | null;
  familyName: string | null;
  locale: string | null;
  weekStartDay: number;
}

interface SuccessResponse {
  success: boolean;
  message?: string;
}

interface UserPreferencesResponse {
  weekStartDay: number;
  locale: string | null;
}

interface SocialAccountResponse {
  id: string;
  provider: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  createdAt: string;
}

interface ValidationErrorResponse {
  code: string;
  message: string;
  details: Record<string, string>;
}

vi.mock('../../utils/auth', () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
  generateTokens: vi.fn(),
  verifyToken: vi.fn().mockImplementation(async (token, _secret) => {
    // Check if it's an invalid token
    if (token === 'invalid-token') {
      throw new Error('Invalid token');
    }
    // Return a properly structured decoded token for valid tests
    return {
      sub: 'test-user',
      type: 'access',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
  }),
}));

describe('Users Routes', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let ctx: ReturnType<typeof createTestContext>;
  let validToken: string;
  const userId = 'test-user';

  // Helper to setup database mock with auth
  const setupDbMock = (getReturns: unknown) => {
    const mockedDb = asMockedDb(ctx.db);
    let callCount = 0;
    mockedDb.select.mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Auth middleware user lookup
          return Promise.resolve({
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            enabled: true,
          });
        }
        // Subsequent calls return the test data
        return Promise.resolve(getReturns);
      }),
    }));
  };

  beforeEach(async () => {
    ctx = createTestContext();
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Generate valid token using jwt directly
    validToken = await jwt.sign(
      {
        sub: userId,
        type: 'access',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      ctx.env.JWT_SECRET
    );
    
    // Add database middleware
    app.use('*', async (c, next) => {
      c.set('db', ctx.db);
      await next();
    });
    
    app.route('/users', usersRoutes);
    vi.clearAllMocks();
    
    // Default mock for auth middleware user lookup
    const mockedDb = asMockedDb(ctx.db);
    mockedDb.select.mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        enabled: true,
      }),
    }));
  });

  describe('Authentication', () => {
    it('should return 401 for missing token', async () => {
      const res = await app.request('/users/profile', {
        method: 'GET',
      }, ctx.env);

      expect(res.status).toBe(401);
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for invalid token', async () => {
      const res = await app.request('/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      }, ctx.env);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /users/profile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'test-user',
        email: 'test@example.com',
        username: 'testuser',
        emailVerified: true,
        profilePictureUrl: 'https://example.com/avatar.jpg',
        givenName: 'Test',
        familyName: 'User',
        locale: 'en-US',
        weekStartDay: 1,
        enabled: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      setupDbMock(mockUser);

      const res = await app.request('/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as UserProfileResponse;
      expect(body).toEqual(mockUser);
    });

    it('should return 404 if user not found', async () => {
      setupDbMock(null);

      const res = await app.request('/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(404);
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /users/profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        username: 'newusername',
        givenName: 'Updated',
        familyName: 'Name',
      };

      // Username not taken
      const mockedDb = asMockedDb(ctx.db);
      let callCount = 0;
      mockedDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // Auth middleware user lookup
            return Promise.resolve({
              id: userId,
              email: 'test@example.com',
              username: 'testuser',
              enabled: true,
            });
          }
          // Username check - not taken
          return Promise.resolve(null);
        }),
      }));

      mockedDb.update.mockImplementation(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'test-user',
          email: 'test@example.com',
          ...updateData,
        }]),
      }));

      const res = await app.request('/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify(updateData),
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as UserUpdateResponse;
      expect(body.username).toBe('newusername');
      expect(body.givenName).toBe('Updated');
    });

    it('should return 409 if username is taken', async () => {
      const mockedDb = asMockedDb(ctx.db);
      let callCount = 0;
      mockedDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // Auth middleware user lookup
            return Promise.resolve({
              id: userId,
              email: 'test@example.com',
              username: 'testuser',
              enabled: true,
            });
          }
          // Username check - taken by another user
          return Promise.resolve({ id: 'other-user', username: 'taken' });
        }),
      }));

      const res = await app.request('/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({ username: 'taken' }),
      }, ctx.env);

      expect(res.status).toBe(409);
      const body = await res.json() as ValidationErrorResponse;
      expect(body.details.username).toBe('Username already taken');
    });

    it('should validate profile update fields', async () => {
      const res = await app.request('/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          username: 'ab', // Too short
          weekStartDay: 7, // Invalid
        }),
      }, ctx.env);

      expect(res.status).toBe(400);
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /users/password', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 'test-user',
        password: 'hashed-old-password',
      };

      setupDbMock(mockUser);

      vi.mocked(authUtils.verifyPassword).mockResolvedValue(true);
      vi.mocked(authUtils.hashPassword).mockResolvedValue('hashed-new-password');

      const mockedDb = asMockedDb(ctx.db);
      mockedDb.update.mockImplementation(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      }));

      const res = await app.request('/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'oldpass123',
          newPassword: 'newpass123',
        }),
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as SuccessResponse;
      expect(body.success).toBe(true);
      expect(vi.mocked(authUtils.verifyPassword)).toHaveBeenCalledWith('oldpass123', 'hashed-old-password');
      expect(vi.mocked(authUtils.hashPassword)).toHaveBeenCalledWith('newpass123');
    });

    it('should reject incorrect current password', async () => {
      setupDbMock({ id: 'test-user', password: 'hash' });

      vi.mocked(authUtils.verifyPassword).mockResolvedValue(false);

      const res = await app.request('/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'wrongpass',
          newPassword: 'newpass123',
        }),
      }, ctx.env);

      expect(res.status).toBe(400);
      const body = await res.json() as ValidationErrorResponse;
      expect(body.details.currentPassword).toBe('Current password is incorrect');
    });

    it('should validate password requirements', async () => {
      const res = await app.request('/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'oldpass',
          newPassword: 'short', // Too short
        }),
      }, ctx.env);

      expect(res.status).toBe(400);
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /users/email', () => {
    it('should update email successfully', async () => {
      const mockUser = {
        id: 'test-user',
        email: 'old@example.com',
        password: 'hashed-password',
      };

      const mockedDb = asMockedDb(ctx.db);
      let callCount = 0;
      mockedDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // Auth middleware lookup
            return Promise.resolve({
              id: userId,
              email: 'test@example.com',
              username: 'testuser',
              enabled: true,
            });
          } else if (callCount === 2) {
            // User lookup for password check
            return Promise.resolve(mockUser);
          } else {
            // Email availability check
            return Promise.resolve(null);
          }
        }),
      }));

      vi.mocked(authUtils.verifyPassword).mockResolvedValue(true);

      mockedDb.update.mockImplementation(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      }));

      const res = await app.request('/users/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          email: 'new@example.com',
          password: 'password123',
        }),
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as SuccessResponse;
      expect(body.success).toBe(true);
    });

    it('should reject if email already exists', async () => {
      const mockedDb = asMockedDb(ctx.db);
      let callCount = 0;
      mockedDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // Auth middleware lookup
            return Promise.resolve({
              id: userId,
              email: 'test@example.com',
              username: 'testuser',
              enabled: true,
            });
          } else if (callCount === 2) {
            // User lookup for password check
            return Promise.resolve({
              id: userId,
              email: 'test@example.com',
              password: 'hashed-password',
            });
          } else {
            // Email availability check - email taken
            return Promise.resolve({ id: 'other-user' });
          }
        }),
      }));

      vi.mocked(authUtils.verifyPassword).mockResolvedValue(true);

      const res = await app.request('/users/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          email: 'taken@example.com',
          password: 'password123',
        }),
      }, ctx.env);

      expect(res.status).toBe(409);
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('CONFLICT');
    });

    it('should validate email format', async () => {
      const res = await app.request('/users/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'password123',
        }),
      }, ctx.env);

      expect(res.status).toBe(400);
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /users/preferences', () => {
    it('should update user preferences', async () => {
      const updateData = {
        weekStartDay: 0,
        locale: 'ja-JP',
      };

      const mockedDb = asMockedDb(ctx.db);
      mockedDb.update.mockImplementation(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updateData]),
      }));

      const res = await app.request('/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify(updateData),
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as UserPreferencesResponse;
      expect(body).toEqual(updateData);
    });

    it('should validate weekStartDay range', async () => {
      const res = await app.request('/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({ weekStartDay: 7 }),
      }, ctx.env);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /users/social-accounts', () => {
    it('should return user social accounts', async () => {
      const mockAccounts = [
        {
          id: '1',
          provider: 'google',
          email: 'user@gmail.com',
          name: 'Test User',
          picture: 'https://example.com/pic.jpg',
          createdAt: '2025-01-01T00:00:00Z',
        },
        {
          id: '2',
          provider: 'github',
          email: 'user@github.com',
          name: 'testuser',
          picture: null,
          createdAt: '2025-01-01T00:00:00Z',
        },
      ];

      const mockedDb = asMockedDb(ctx.db);
      let callCount = 0;
      mockedDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // Auth middleware
            return {
              get: vi.fn().mockResolvedValue({
                id: userId,
                email: 'test@example.com',
                username: 'testuser',
                enabled: true,
              }),
            };
          }
          // Social accounts query
          return Promise.resolve(mockAccounts);
        }),
      }));

      const res = await app.request('/users/social-accounts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as SocialAccountResponse[];
      expect(body).toEqual(mockAccounts);
    });
  });

  describe('DELETE /users/social-accounts/:provider', () => {
    it('should delete social account', async () => {
      const mockUser = { id: 'test-user', password: 'hash' };
      const mockAccounts = [
        { provider: 'google' },
        { provider: 'github' },
      ];

      const mockedDb = asMockedDb(ctx.db);
      let callCount = 0;
      mockedDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Auth middleware
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            get: vi.fn().mockResolvedValue({
              id: userId,
              email: 'test@example.com',
              username: 'testuser',
              enabled: true,
            }),
          };
        } else if (callCount === 2) {
          // First query in Promise.all - user check
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            get: vi.fn().mockResolvedValue(mockUser),
          };
        } else {
          // Second query in Promise.all - social accounts
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(mockAccounts),
          };
        }
      });

      mockedDb.delete.mockImplementation(() => ({
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: '1' }]),
      }));

      const res = await app.request('/users/social-accounts/google', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(204);
    });

    it('should prevent deleting last auth method', async () => {
      const mockUser = { id: 'test-user', password: null }; // No password
      const mockAccounts = [{ provider: 'google' }]; // Only one social account

      const mockedDb = asMockedDb(ctx.db);
      let callCount = 0;
      mockedDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Auth middleware
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            get: vi.fn().mockResolvedValue({
              id: userId,
              email: 'test@example.com',
              username: 'testuser',
              enabled: true,
            }),
          };
        } else if (callCount === 2) {
          // User check for password
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            get: vi.fn().mockResolvedValue(mockUser),
          };
        } else {
          // Social accounts query
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(mockAccounts),
          };
        }
      });

      const res = await app.request('/users/social-accounts/google', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(400);
      const body = await res.json() as MessageResponse;
      expect(body.message).toContain('Cannot remove the last authentication method');
    });

    it('should return 404 if social account not found', async () => {
      setupDbMock({ id: 'test-user', password: 'hash' });

      const mockedDb = asMockedDb(ctx.db);
      mockedDb.delete.mockImplementation(() => ({
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      }));

      const res = await app.request('/users/social-accounts/unknown', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /users/account', () => {
    it('should disable account with correct password', async () => {
      const mockUser = {
        id: 'test-user',
        password: 'hashed-password',
      };

      setupDbMock(mockUser);

      vi.mocked(authUtils.verifyPassword).mockResolvedValue(true);

      const mockedDb = asMockedDb(ctx.db);
      mockedDb.update.mockImplementation(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      }));

      const res = await app.request('/users/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({ password: 'password123' }),
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as SuccessResponse;
      expect(body.success).toBe(true);
    });

    it('should reject with incorrect password', async () => {
      setupDbMock({ id: 'test-user', password: 'hash' });

      vi.mocked(authUtils.verifyPassword).mockResolvedValue(false);

      const res = await app.request('/users/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({ password: 'wrongpass' }),
      }, ctx.env);

      expect(res.status).toBe(401);
      const body = await res.json() as { code: string; message: string; details: Record<string, string> };
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Invalid input');
      expect(body.details.password).toBe('Password is incorrect');
    });
  });

  describe('POST /users/verify-email', () => {
    it('should verify email successfully', async () => {
      const mockedDb = asMockedDb(ctx.db);
      mockedDb.update.mockImplementation(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      }));

      const res = await app.request('/users/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({ token: 'verification-token' }),
      }, ctx.env);

      expect(res.status).toBe(200);
      const body = await res.json() as SuccessResponse;
      expect(body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockedDb = asMockedDb(ctx.db);
      let callCount = 0;
      mockedDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Auth middleware succeeds
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            get: vi.fn().mockResolvedValue({
              id: userId,
              email: 'test@example.com',
              username: 'testuser',
              enabled: true,
            }),
          };
        }
        // Profile query fails
        throw new Error('Database connection failed');
      });

      const res = await app.request('/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      expect(res.status).toBe(500);
      const body = await res.json() as ErrorResponse;
      expect(body.code).toBe('INTERNAL_ERROR');
    });
  });
});