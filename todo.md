# TODO Management Rules

This file tracks pending tasks organized by feature. 
- Tasks are listed as simple bullet points (not checkboxes)
- Each task can have a priority tag: [HIGH], [MEDIUM], [LOW]
- Completed tasks should be deleted from this file
- Empty feature sections should remain to show no pending work
- Completed work can be tracked through PR history

---

## Common
- [LOW] Add Multi-Factor Authentication (2FA) - TOTP-based authentication with backup recovery codes
- [LOW] Implement Security Event Logging - Use existing securityEvents table for auth attempts and suspicious activities
- [LOW] Add Field-Level Encryption - Encrypt sensitive user data at rest using Cloudflare's Web Crypto API (requires Cloudflare Workers runtime)

## Auth Feature
- [HIGH] Fix logout - session token not clearing properly, auto-redirects to dashboard after F5 or navigating to landing page

## Dashboard Feature
- [MEDIUM] Add feature toggles - allow users to control enabled features in dashboard/sidebar

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
- [HIGH] Fix CI E2E test configuration - Currently only runs ci.spec.ts with 4 basic tests
- [HIGH] Fix failing note creation test in ci.spec.ts - Test times out waiting for API response
- [HIGH] Expand CI test coverage - Include critical path tests from other spec files
- [HIGH] Optimize E2E test performance - Tests run slowly when multiple execute in parallel
- [MEDIUM] Review and consolidate duplicate E2E test files (38 spec files, many overlapping)
- [MEDIUM] Create focused CI test suites for different scenarios (smoke, critical, full)
- [MEDIUM] Fix global setup issues causing EPIPE errors in some environments
- [LOW] Add E2E test documentation explaining test organization and running locally

## i18n (Internationalization)
- [HIGH] Translate backend error messages and API responses with Accept-Language header support
- [MEDIUM] Configure date-fns with locale imports for date/time formatting
- [MEDIUM] Translate dashboard cards, empty states, and status indicators
- [MEDIUM] Internationalize toast notifications and loading states
- [MEDIUM] Add locale detection from browser preferences as fallback
- [LOW] Implement timezone handling for international users
- [LOW] Add 12h/24h time format preference support
- [LOW] Create translation management workflow and documentation
- [LOW] Set up translation keys extraction tool for maintainability

## Performance
- [LOW] Performance optimizations - target <3s page load time and <250ms API response time for smoother user experience