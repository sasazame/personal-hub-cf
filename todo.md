# TODO Management Rules

This file tracks pending tasks organized by feature. 
- Tasks are listed as simple bullet points (not checkboxes)
- Each task can have a priority tag: [HIGH], [MEDIUM], [LOW]
- Completed tasks should be deleted from this file
- Empty feature sections should remain to show no pending work
- Completed work can be tracked through PR history

---

## Common
- [MEDIUM] Add CSRF Protection - Implement CSRF tokens for state-changing operations, use SameSite cookie attribute
- [MEDIUM] Enhance Session Management - Switch from localStorage to httpOnly secure cookies, implement inactivity timeout (30 minutes)
- [LOW] Add Multi-Factor Authentication (2FA) - TOTP-based authentication with backup recovery codes
- [LOW] Implement Security Event Logging - Use existing securityEvents table for auth attempts and suspicious activities
- [LOW] Add Field-Level Encryption - Encrypt sensitive user data at rest using Cloudflare's Web Crypto API

## Auth Feature

## Dashboard Feature

## TODO Feature

## Calendar Feature

## Notes Feature

## Goals Feature

## Moments Feature

## Pomodoro Feature
- [HIGH] Fix Pomodoro session failed to end bug - GET /api/v1/pomodoro/sessions/active returns 404
- [HIGH] Fix Pomodoro timer style in light mode - background color and texts incorrectly use dark theme values

## Analytics Feature

## Settings Feature

## Profile Feature

## Testing
- [MEDIUM] Investigate and fix E2E test stability issues

## Performance
- [LOW] Performance optimizations needed for smoother user experience