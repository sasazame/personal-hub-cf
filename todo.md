# TODO Management Rules

This file tracks pending tasks organized by feature. 
- Tasks are listed as simple bullet points (not checkboxes)
- Each task can have a priority tag: [HIGH], [MEDIUM], [LOW]
- Completed tasks should be deleted from this file when creating a PR
- Empty feature sections should remain to show no pending work
- Completed work can be tracked through PR history
- **IMPORTANT**: Update this file when creating PRs to remove completed tasks

---

## Common
- [HIGH] Encrypt TOTP secrets in database - Currently stored in plain text, implement AES-GCM encryption
- [HIGH] Add salt to recovery code hashes - Currently using simple SHA-256 without salts, vulnerable to rainbow table attacks
- [HIGH] Add rate limiting to 2FA verification endpoints - Prevent brute force attacks on TOTP codes
- [HIGH] Implement security event audit logging for 2FA - Track all 2FA setup, verification, disable, and recovery code usage
- [LOW] Implement Security Event Logging - Use existing securityEvents table for auth attempts and suspicious activities
- [LOW] Add Field-Level Encryption - Encrypt sensitive user data at rest using Cloudflare's Web Crypto API (requires Cloudflare Workers runtime)

## Auth Feature

## Dashboard Feature

## TODO Feature

## Calendar Feature

## Notes Feature

## Goals Feature

## Moments Feature

## Pomodoro Feature

## Analytics Feature

## Settings Feature

## Profile Feature

## Testing
- [LOW] Add E2E test documentation explaining test organization and running locally

## i18n (Internationalization)
- [LOW] Implement timezone handling for international users
- [LOW] Add 12h/24h time format preference support
- [LOW] Create translation management workflow and documentation
- [LOW] Set up translation keys extraction tool for maintainability

## Performance
- [LOW] Performance optimizations - target <3s page load time and <250ms API response time for smoother user experience