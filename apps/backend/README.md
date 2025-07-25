# Personal Hub Backend - Cloudflare Workers

This is the Cloudflare Workers backend implementation that provides 100% API compatibility with the original Spring Boot backend.

## Architecture

- **Runtime**: Cloudflare Workers
- **Framework**: Hono (lightweight web framework)
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle
- **Authentication**: JWT + OAuth2

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create D1 database (already done):
```bash
pnpm wrangler d1 create personal-hub
```

3. Apply migrations:
```bash
pnpm wrangler d1 execute personal-hub --local --file migrations/0001_init_schema.sql
```

4. Start development server:
```bash
pnpm dev
```

## API Endpoints

All endpoints are now implemented with 100% API compatibility with the Spring Boot backend.

### Authentication (`/api/v1/auth/*`)
- `POST /register` - Register new user
- `POST /login` - Login with email/password
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user profile
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `GET /oauth/github` - GitHub OAuth flow
- `GET /oauth/google` - Google OAuth flow

### TODOs (`/api/v1/todos/*`)
- `GET /` - List todos with filtering and pagination
- `GET /:id` - Get specific todo
- `POST /` - Create new todo
- `PUT /:id` - Update todo
- `DELETE /:id` - Delete todo
- `POST /:id/complete` - Mark todo as complete
- `GET /:id/subtasks` - Get subtasks of a todo

### Goals (`/api/v1/goals/*`)
- `GET /` - List goals
- `GET /:id` - Get specific goal
- `POST /` - Create new goal
- `PUT /:id` - Update goal
- `DELETE /:id` - Delete goal
- `GET /:id/achievements` - Get goal achievements
- `POST /:id/achievements` - Record achievement
- `DELETE /:goalId/achievements/:id` - Delete achievement

### Pomodoro (`/api/v1/pomodoro/*`)
- `GET /sessions` - List sessions
- `GET /sessions/active` - Get active session
- `GET /sessions/:id` - Get specific session
- `POST /sessions` - Create new session
- `PUT /sessions/:id` - Update session
- `PUT /sessions/:sessionId/tasks/:taskId` - Update task
- `GET /config` - Get pomodoro config
- `PUT /config` - Update pomodoro config
- `GET /stats` - Get pomodoro statistics

### Events/Calendar (`/api/v1/events/*`)
- `GET /` - List events with date range filtering
- `GET /:id` - Get specific event
- `POST /` - Create new event
- `PUT /:id` - Update event
- `DELETE /:id` - Delete event
- `GET /sync/settings` - Get calendar sync settings
- `POST /sync/settings` - Create sync settings
- `PUT /sync/settings/:id` - Update sync settings
- `DELETE /sync/settings/:id` - Delete sync settings
- `POST /sync` - Trigger calendar sync

### Notes (`/api/v1/notes/*`)
- `GET /` - List notes with search and pagination
- `GET /:id` - Get specific note
- `POST /` - Create new note
- `PUT /:id` - Update note
- `DELETE /:id` - Delete note
- `GET /tags` - Get all tags with counts

### Moments (`/api/v1/moments/*`)
- `GET /` - List moments with filtering
- `GET /:id` - Get specific moment
- `POST /` - Create new moment
- `PUT /:id` - Update moment
- `DELETE /:id` - Delete moment
- `GET /today` - Get today's moments
- `GET /tags` - Get all tags with counts
- `GET /stats` - Get moment statistics

### User Management (`/api/v1/users/*`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `PUT /password` - Change password
- `PUT /email` - Update email
- `PUT /preferences` - Update preferences
- `GET /social-accounts` - List connected social accounts
- `DELETE /social-accounts/:provider` - Disconnect social account
- `DELETE /account` - Delete/disable account
- `POST /verify-email` - Verify email address

### Analytics (`/api/v1/analytics/*`)
- `GET /overview` - Get overall statistics
- `GET /productivity` - Get productivity metrics
- `GET /habits` - Get habit analytics
- `GET /goals-progress` - Get goals progress
- `GET /tags` - Get tag analytics
- `GET /time-distribution` - Get time distribution analytics

## Environment Variables

Configure in `wrangler.toml`:
- `JWT_SECRET` - Secret for JWT signing
- `OAUTH_GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `OAUTH_GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `OAUTH_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `OAUTH_GOOGLE_CLIENT_SECRET` - Google OAuth client secret

## Testing

Run API compatibility tests:
```bash
# Start the backend first
pnpm dev

# In another terminal, run compatibility tests
cd ../api-compat-test
pnpm test:compare
```

## Deployment

Deploy to Cloudflare Workers:
```bash
pnpm deploy
```

## Migration Progress

- ✅ Database schema created
- ✅ Authentication endpoints implemented
- ⏳ OAuth callback handlers
- ⏳ Remaining API endpoints
- ⏳ Rate limiting
- ⏳ CORS configuration for production