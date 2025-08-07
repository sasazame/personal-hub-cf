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

## i18n (Internationalization)
- [HIGH] Install and configure react-i18next in frontend with i18n provider setup
- [HIGH] Create translation file structure (locales/en/, locales/ja/, etc.) with JSON resource files
- [HIGH] Replace hardcoded text in authentication pages (Login, Register) with translation keys
- [HIGH] Translate navigation menu items and page titles in Sidebar component
- [HIGH] Internationalize all form labels, placeholders, and validation messages
- [HIGH] Translate backend error messages and API responses with Accept-Language header support
- [MEDIUM] Implement language switcher functionality connected to user locale preference
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