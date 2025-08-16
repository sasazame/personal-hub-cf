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
- [HIGH] Add command palette feature - Provide keyboard shortcuts to all features and cross-search functionality
- [LOW] Add Field-Level Encryption - Encrypt sensitive user data at rest using Cloudflare's Web Crypto API (requires Cloudflare Workers runtime)

## Auth Feature

## Dashboard Feature

## TODO Feature

## Calendar Feature

## Notes Feature

## Goals Feature

## Moments Feature
- [MEDIUM] Add keyboard shortcuts for moment tag selection - Enable Shift+F1-F12 shortcuts for quick tag selection

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
- [LOW] Performance optimizations - target p95 metrics: <2.5s LCP (Largest Contentful Paint), <250ms API response time

## Future Enhancements (Not Currently Planned)
### Two-Factor Authentication (2FA)
- Postponed due to significant system impact; not on current roadmap. Re-evaluate after prerequisites below are complete.
- Required security hardening before implementation:
  - Encrypt TOTP secrets at rest using AEAD (AES-GCM) with unique per-secret nonces; define key management and rotation (e.g., envelope encryption/KMS).
  - Store recovery codes as one-time-use hashes using a password hashing function (Argon2id/bcrypt/scrypt) with per-code random salts.
  - Add rate limiting and lockout/backoff on verification endpoints (per user + IP); provide a safe recovery flow.
  - Add audit logging for enrollment, verification, backup-code use, disable/reset, and suspicious activity (actor, IP, UA, timestamp); define retention.
  - Time drift policy: accept ±1 step and block replay within the window.
  - UX flows: enrollment (QR/otpauth URI), backup codes issuance/regeneration, step-up auth for sensitive actions, recovery and admin override.
- Full implementation details are preserved in closed PR #47.
- Consider WebAuthn/passkeys as a phishing-resistant alternative in a future phase.