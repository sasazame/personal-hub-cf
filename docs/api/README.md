# Personal Hub API Reference

## Base URL
- Development: `http://localhost:8787`
- Production: `https://api.personalhub.com`

## Authentication
All endpoints except `/auth/*` require JWT Bearer token in Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response
```json
{
  "data": { ... }  // For single resource
  // or
  [ ... ]          // For collections
}
```

### Error Response
```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable message",
  "details": { ... },  // Optional field-specific errors
  "timestamp": "2025-01-27T10:00:00.000Z"
}
```

## Common Error Codes
| Code | HTTP Status | Description |
|------|------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `USER_EXISTS` | 409 | Email already registered |
| `CONFLICT` | 409 | Resource conflict |
| `INTERNAL_ERROR` | 500 | Server error |

## Endpoints

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (201/200):**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "user-123",
    "username": "johndoe",
    "email": "user@example.com",
    "weekStartDay": 0,
    "createdAt": "2025-01-27T10:00:00.000Z",
    "updatedAt": "2025-01-27T10:00:00.000Z"
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

### Todos

#### List Todos
```http
GET /todos?status=TODO&priority=HIGH&tag=work&limit=20&offset=0
```

#### Create Todo
```http
POST /todos
Content-Type: application/json

{
  "title": "Complete project",
  "description": "Finish the API documentation",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2025-02-01",
  "tags": "work,urgent"
}
```

#### Update Todo
```http
PUT /todos/{id}
Content-Type: application/json

{
  "status": "DONE"
}
```

#### Delete Todo
```http
DELETE /todos/{id}
```

### Notes

#### List Notes
```http
GET /notes?tag=meeting&category=work&search=api&limit=20&offset=0
```

#### Create Note
```http
POST /notes
Content-Type: application/json

{
  "title": "API Design Meeting",
  "content": "Discussed REST vs GraphQL...",
  "tags": "meeting,api",
  "category": "work"
}
```

### Moments

#### List Moments
```http
GET /moments?tag=insight&limit=20&offset=0
```

#### Create Moment
```http
POST /moments
Content-Type: application/json

{
  "content": "Just realized we can optimize the query by...",
  "tags": "insight,optimization"
}
```

#### Get Default Tags
```http
GET /moments/tags/default
```

### Events

#### List Events
```http
GET /events?from=2025-01-01&to=2025-01-31
```

#### Get Events in Date Range
```http
GET /events/range?startDate=2025-01-01&endDate=2025-01-31
```

#### Create Event
```http
POST /events
Content-Type: application/json

{
  "title": "Team Meeting",
  "description": "Quarterly review",
  "startDateTime": "2025-01-28T10:00:00Z",
  "endDateTime": "2025-01-28T11:00:00Z",
  "location": "Conference Room A",
  "reminder": true,
  "reminderMinutes": 15
}
```

### Goals

#### List Goals
```http
GET /goals?active=true
```

#### Create Goal
```http
POST /goals
Content-Type: application/json

{
  "title": "Read 12 books",
  "description": "Read one book per month",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "targetValue": 12,
  "currentValue": 0,
  "unit": "books",
  "isActive": true
}
```

#### Record Achievement
```http
POST /goals/{id}/achievements
Content-Type: application/json

{
  "achievedDate": "2025-01-27"
}
```

### Pomodoro

#### Get Active Session
```http
GET /pomodoro/sessions/active
```

#### Start Session
```http
POST /pomodoro/sessions
Content-Type: application/json

{
  "workDuration": 25,
  "breakDuration": 5,
  "tasks": [
    {
      "description": "Complete API documentation",
      "orderIndex": 0
    },
    {
      "todoId": 123,
      "description": "Review PR",
      "orderIndex": 1
    }
  ]
}
```

#### Update Session
```http
PUT /pomodoro/sessions/{id}
Content-Type: application/json

{
  "status": "COMPLETED",
  "completedCycles": 4
}
```

#### Get/Update Config
```http
GET /pomodoro/config
PUT /pomodoro/config
```

### Analytics

#### Overview
```http
GET /analytics/overview
```

#### Productivity
```http
GET /analytics/productivity?fromDate=2025-01-01&toDate=2025-01-31
```

#### Habits
```http
GET /analytics/habits?days=30
```

#### Goals Progress
```http
GET /analytics/goals-progress
```

#### Tag Analytics
```http
GET /analytics/tags
```

#### Time Distribution
```http
GET /analytics/time-distribution?days=7
```

### Users

#### Get Profile
```http
GET /users/me
```

#### Update Profile
```http
PUT /users/me
Content-Type: application/json

{
  "username": "newusername",
  "weekStartDay": 1
}
```

#### Change Password
```http
PUT /users/me/password
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

## Rate Limiting
- 100 requests per minute per IP
- 429 Too Many Requests response when exceeded

## Pagination
Use `limit` and `offset` query parameters:
- `limit`: Number of items per page (default: 20, max: 100)
- `offset`: Number of items to skip (default: 0)

## Date/Time Format
All dates and times use ISO 8601 format:
- Date: `2025-01-27`
- DateTime: `2025-01-27T10:00:00.000Z`

## Status Enums

### Todo Status
- `TODO` - Not started
- `IN_PROGRESS` - In progress
- `DONE` - Completed

### Priority
- `LOW` - Low priority
- `MEDIUM` - Medium priority
- `HIGH` - High priority

### Pomodoro Status
- `ACTIVE` - Session in progress
- `PAUSED` - Session paused
- `COMPLETED` - Session completed
- `CANCELLED` - Session cancelled