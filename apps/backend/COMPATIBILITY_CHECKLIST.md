# API Compatibility Checklist

## Critical Response Format Differences to Verify

### 1. Authentication Responses

#### Spring Boot Response Format
```json
// POST /auth/register
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",  // UUID format
    "email": "test@example.com",
    "username": "test",
    "emailVerified": false,
    "createdAt": "2025-01-24T10:00:00Z",
    "updatedAt": "2025-01-24T10:00:00Z"
  },
  "token": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

#### Our Current Response
```json
{
  "user": {
    "id": "WgEexJCD8cAtRCtEuHSr4",  // nanoid format (NOT UUID!)
    "email": "test@example.com",
    "username": "test",
    "emailVerified": false
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### 2. TODO Response Format

#### Spring Boot
```json
{
  "content": [
    {
      "id": 1,
      "title": "Test TODO",
      "description": "Description",
      "status": "TODO",
      "priority": "MEDIUM",
      "dueDate": null,
      "createdAt": "2025-01-24T10:00:00Z",
      "updatedAt": "2025-01-24T10:00:00Z",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "parentId": null,
      "children": []
    }
  ],
  "pageable": {
    "sort": { "sorted": false },
    "pageNumber": 0,
    "pageSize": 20,
    "offset": 0
  },
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true
}
```

#### Our Current Response
```json
{
  "items": [
    {
      "id": 1,
      "userId": "WgEexJCD8cAtRCtEuHSr4",
      "title": "Test TODO",
      "description": "Description",
      "status": "TODO",
      "priority": "MEDIUM",
      "dueDate": null,
      "createdAt": "2025-01-24T23:29:49.194Z",
      "updatedAt": "2025-01-24T23:29:49.194Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

## Major Incompatibilities Found

### 1. **UUID vs nanoid**
- Spring Boot uses UUID format: `550e8400-e29b-41d4-a716-446655440000`
- We use nanoid: `WgEexJCD8cAtRCtEuHSr4`
- **Impact**: Frontend expects UUID format

### 2. **Response Structure**
- Spring Boot uses `content` for arrays, we use `items`
- Spring Boot has `pageable` object with nested pagination info
- We have flat pagination fields

### 3. **Token Response**
- Spring Boot nests tokens in a `token` object with `expiresIn` and `tokenType`
- We return tokens directly without metadata

### 4. **Timestamp Format**
- Both use ISO format but might have minor differences

### 5. **Error Responses**
- Need to verify error response format matches exactly

## Required Changes for 100% Compatibility

1. **Switch to UUID**:
   ```typescript
   // Replace nanoid with crypto.randomUUID()
   const userId = crypto.randomUUID();
   ```

2. **Match Response Structures**:
   - Wrap arrays in `content` property
   - Add `pageable` object for paginated responses
   - Nest auth tokens in `token` object

3. **Add Missing Fields**:
   - `expiresIn` for tokens
   - `tokenType: "Bearer"`
   - `children` array for todos
   - Timestamp fields on all responses

4. **Error Response Format**:
   ```json
   {
     "timestamp": "2025-01-24T10:00:00Z",
     "status": 400,
     "error": "Bad Request",
     "message": "Validation failed",
     "path": "/api/v1/todos"
   }
   ```

## Testing Strategy

1. Run Spring Boot backend on port 8080
2. Run our backend on port 8787
3. Use the api-compat-test suite to compare:
   - Response structures
   - Field names and types
   - Pagination formats
   - Error responses
   - Status codes

Without the Spring Boot backend running, we cannot verify exact compatibility. The response formats are likely different and need adjustment.