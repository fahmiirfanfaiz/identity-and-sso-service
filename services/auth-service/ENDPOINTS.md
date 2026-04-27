# Auth Service — API Endpoints

Base URL: `http://localhost:3001/api/auth`

---

## Health Check

| Method | Path | Auth Required | Description |
|--------|------|:-------------:|-------------|
| GET | `/health` | No | Service health status |

**Response 200:**
```json
{
  "success": true,
  "status": "ok",
  "service": "auth-service",
  "uptime": 12.345,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Authentication Endpoints

### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation:**
- `name` — required, non-empty
- `email` — required, valid email format
- `password` — required, minimum 8 characters

**Response 201 Created:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "is_active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `409 Conflict` — Email already registered
- `422 Unprocessable Entity` — Validation errors

---

### POST `/api/auth/login`
Authenticate a user and obtain tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "<jwt_access_token>",
    "refreshToken": "<jwt_refresh_token>",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "is_active": true
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` — Invalid credentials or inactive account
- `422 Unprocessable Entity` — Validation errors

---

### POST `/api/auth/refresh`
Obtain a new access token using a valid refresh token.

**Request Body:**
```json
{
  "refreshToken": "<jwt_refresh_token>"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Access token refreshed",
  "data": {
    "accessToken": "<new_jwt_access_token>"
  }
}
```

**Error Responses:**
- `400 Bad Request` — Refresh token not provided
- `401 Unauthorized` — Invalid or expired refresh token

---

### POST `/api/auth/logout` 🔐
Revoke the current refresh token. Requires authentication.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "<jwt_refresh_token>"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Responses:**
- `400 Bad Request` — Refresh token not provided
- `401 Unauthorized` — Invalid or missing access token

---

## Profile Endpoints

### GET `/api/auth/profile` 🔐
Retrieve the authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "is_active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` — Invalid or missing access token
- `404 Not Found` — User not found

---

### PUT `/api/auth/profile` 🔐
Update the authenticated user's name and/or password.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body (all fields optional):**
```json
{
  "name": "Jane Doe",
  "password": "newpassword123"
}
```

**Validation:**
- `name` — optional, non-empty
- `password` — optional, minimum 8 characters

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "john@example.com",
      "role": "client",
      "is_active": true
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` — Invalid or missing access token
- `404 Not Found` — User not found
- `422 Unprocessable Entity` — Validation errors

---

## Standard Response Formats

### Success
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "...",
  "errors": [ { "field": "email", "message": "Valid email is required" } ]
}
```

---

## Token Info

| Token | Expiry | Usage |
|-------|--------|-------|
| Access Token | 15 minutes | `Authorization: Bearer <token>` header |
| Refresh Token | 7 days | Body of `/api/auth/refresh` and `/api/auth/logout` |

---

## User Roles

| Role | Description |
|------|-------------|
| `client` | Default role — posts project bids |
| `freelancer` | Applies to project bids |
| `admin` | Platform administrator |
