# Architecture Overview

This document describes the high-level architecture of Personal Hub.

## Platform

- Backend: Cloudflare Workers (Hono)
- Database: Cloudflare D1 (SQLite)
- Frontend: React (Vite) on Cloudflare Pages
- CI/CD: GitHub Actions (build, test, deploy)

## API

- Base path: `/api/v1`
- Auth: JWT (access + refresh), CSRF middleware, security headers
- Rate limiting: Strict on auth endpoints, general rate limiting elsewhere
- Consistent error format with codes and localized messages

## Key Features

- Todos, Notes, Moments, Calendar Events, Goals
- Pomodoro (sessions, tasks, configuration, stats)
- Analytics (overview, productivity, habits, goals, tags)
- User profile/settings, feature preferences, social accounts

## Frontend UX

- Command Palette (Ctrl/Cmd+K) with history and accessibility improvements
- Global keyboard shortcuts for navigation (Alt + D/T/N/G/P/C/M/A)
- Settings shortcuts (Alt + Shift + T for theme, Alt + Shift + L for logout)
- Moments tag shortcuts (Shift + F1..F5)
- Theme: light, dark, and system with semantic tokens

## Deployment

- Automatic D1 migrations during backend deploy
- Manual migration workflow available for one-off operations
- Health check and endpoint verification post-deploy

## Security

- Security headers and CSP
- CSRF protection
- Security event logging (auth events, suspicious activity, rate limits)

