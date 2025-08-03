## security - high priority
- [ ] Implement Rate Limiting
  - Add rate limiting middleware for auth endpoints (login, register, password reset)
  - Use Cloudflare's rate limiting or implement custom solution
  - 5 requests per 15 minutes per IP for auth endpoints
- [ ] Add Security Headers
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Strict-Transport-Security: max-age=31536000; includeSubDomains
  - Content-Security-Policy headers
- [ ] Restrict CORS Origins
  - Replace wildcard origin with allowed domain list
  - Configure separate origins for development and production

## security - medium priority
- [ ] Implement Account Lockout
  - Track failed login attempts in database
  - Lock account after 5 failed attempts
  - Require email verification or time-based unlock
- [ ] Add CSRF Protection
  - Implement CSRF tokens for state-changing operations
  - Use SameSite cookie attribute
  - Add double-submit cookie pattern
- [ ] Enhance Session Management
  - Switch from localStorage to httpOnly secure cookies
  - Implement inactivity timeout (30 minutes)
  - Add device/session tracking
  - Limit concurrent sessions per user

## security - low priority
- [ ] Add Multi-Factor Authentication (2FA)
  - TOTP-based authentication
  - Backup recovery codes
  - Optional per-user setting
- [ ] Implement Security Event Logging
  - Use existing securityEvents table
  - Log authentication attempts
  - Log password changes and resets
  - Log suspicious activities
- [ ] Add Field-Level Encryption
  - Encrypt sensitive user data at rest
  - Use Cloudflare's Web Crypto API
  - Implement key rotation strategy

## known issues
- E2E tests still have some stability issues that need deeper investigation
- Performance optimizations needed for smoother user experience
- Development JWT secret is hardcoded in wrangler.toml