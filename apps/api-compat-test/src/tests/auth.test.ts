import { APITest } from '../config';
import { v4 as uuidv4 } from 'uuid';

const testEmail = `test-${uuidv4()}@example.com`;
const testPassword = 'TestPassword123!';
let authToken: string | null = null;
let refreshToken: string | null = null;

export const authTests: APITest[] = [
  {
    name: 'POST /auth/register - Create new user',
    method: 'POST',
    endpoint: '/auth/register',
    body: {
      email: testEmail,
      password: testPassword,
      username: `testuser_${Date.now()}`,
    },
    expectedStatus: 201,
    validateResponse: (oldRes, _newRes) => {
      // Store tokens for subsequent tests
      if (oldRes.data?.accessToken) {
        authToken = oldRes.data.accessToken;
      }
      if (oldRes.data?.refreshToken) {
        refreshToken = oldRes.data.refreshToken;
      }
    },
  },
  
  {
    name: 'POST /auth/register - Duplicate email',
    method: 'POST',
    endpoint: '/auth/register',
    body: {
      email: testEmail,
      password: testPassword,
      username: `testuser2_${Date.now()}`,
    },
    expectedStatus: 409,
  },
  
  {
    name: 'POST /auth/register - Invalid email',
    method: 'POST',
    endpoint: '/auth/register',
    body: {
      email: 'invalid-email',
      password: testPassword,
      username: `testuser3_${Date.now()}`,
    },
    expectedStatus: 400,
  },
  
  {
    name: 'POST /auth/register - Weak password',
    method: 'POST',
    endpoint: '/auth/register',
    body: {
      email: `weak-${uuidv4()}@example.com`,
      password: '123',
      username: `testuser4_${Date.now()}`,
    },
    expectedStatus: 400,
  },
  
  {
    name: 'POST /auth/login - Valid credentials',
    method: 'POST',
    endpoint: '/auth/login',
    body: {
      email: testEmail,
      password: testPassword,
    },
    expectedStatus: 200,
    validateResponse: (oldRes, _newRes) => {
      // Update auth token
      if (oldRes.data?.accessToken) {
        authToken = oldRes.data.accessToken;
      }
      if (oldRes.data?.refreshToken) {
        refreshToken = oldRes.data.refreshToken;
      }
    },
  },
  
  {
    name: 'POST /auth/login - Invalid password',
    method: 'POST',
    endpoint: '/auth/login',
    body: {
      email: testEmail,
      password: 'WrongPassword123!',
    },
    expectedStatus: 401,
  },
  
  {
    name: 'POST /auth/login - Non-existent user',
    method: 'POST',
    endpoint: '/auth/login',
    body: {
      email: 'nonexistent@example.com',
      password: testPassword,
    },
    expectedStatus: 401,
  },
  
  {
    name: 'GET /auth/me - With valid token',
    method: 'GET',
    endpoint: '/auth/me',
    requiresAuth: true,
    get authToken() { return authToken || ''; },
    expectedStatus: 200,
  },
  
  {
    name: 'GET /auth/me - Without token',
    method: 'GET',
    endpoint: '/auth/me',
    expectedStatus: 401,
  },
  
  {
    name: 'GET /auth/me - With invalid token',
    method: 'GET',
    endpoint: '/auth/me',
    headers: {
      'Authorization': 'Bearer invalid-token',
    },
    expectedStatus: 401,
  },
  
  {
    name: 'POST /auth/refresh - Valid refresh token',
    method: 'POST',
    endpoint: '/auth/refresh',
    body: {
      refreshToken: refreshToken || 'test-refresh-token',
    },
    expectedStatus: 200,
    skip: !refreshToken,
    skipReason: 'No refresh token available from previous tests',
  },
  
  {
    name: 'POST /auth/refresh - Invalid refresh token',
    method: 'POST',
    endpoint: '/auth/refresh',
    body: {
      refreshToken: 'invalid-refresh-token',
    },
    expectedStatus: 401,
  },
  
  {
    name: 'POST /auth/logout - With valid token',
    method: 'POST',
    endpoint: '/auth/logout',
    requiresAuth: true,
    get authToken() { return authToken || ''; },
    expectedStatus: 200,
  },
  
  {
    name: 'POST /auth/forgot-password - Valid email',
    method: 'POST',
    endpoint: '/auth/forgot-password',
    body: {
      email: testEmail,
    },
    expectedStatus: 200,
  },
  
  {
    name: 'POST /auth/forgot-password - Non-existent email',
    method: 'POST',
    endpoint: '/auth/forgot-password',
    body: {
      email: 'nonexistent@example.com',
    },
    expectedStatus: 200, // Should not reveal if email exists
  },
  
  {
    name: 'GET /auth/validate-reset-token - Invalid token',
    method: 'GET',
    endpoint: '/auth/validate-reset-token',
    headers: {
      'X-Reset-Token': 'invalid-reset-token',
    },
    expectedStatus: 400,
  },
  
  {
    name: 'POST /auth/reset-password - Invalid token',
    method: 'POST',
    endpoint: '/auth/reset-password',
    body: {
      token: 'invalid-reset-token',
      newPassword: 'NewPassword123!',
    },
    expectedStatus: 400,
  },
  
  // OAuth2 endpoints
  {
    name: 'GET /auth/oidc/google/authorize',
    method: 'GET',
    endpoint: '/auth/oidc/google/authorize',
    expectedStatus: 302, // Redirect to Google
  },
  
  {
    name: 'GET /auth/oidc/github/authorize',
    method: 'GET',
    endpoint: '/auth/oidc/github/authorize',
    expectedStatus: 302, // Redirect to GitHub
  },
  
  {
    name: 'POST /auth/oidc/google/callback - Invalid code',
    method: 'POST',
    endpoint: '/auth/oidc/google/callback',
    body: {
      code: 'invalid-auth-code',
      state: 'test-state',
    },
    expectedStatus: 400,
  },
  
  {
    name: 'POST /auth/oidc/github/callback - Invalid code',
    method: 'POST',
    endpoint: '/auth/oidc/github/callback',
    body: {
      code: 'invalid-auth-code',
      state: 'test-state',
    },
    expectedStatus: 400,
  },
];