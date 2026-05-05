# Auth Service - API Endpoints

Base URL: `http://localhost:3001/api/auth`

## Health Check

| Method | Path | Auth Required | Description |
|--------|------|:-------------:|-------------|
| GET | `/health` | No | Service health status |

## Authentication Endpoints

### POST `/api/auth/register`

Register a new `mahasiswa` or `mitra` account.

Example request:

```json
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "password": "password123",
  "role": "mahasiswa"
}
```

Validation:

- `name` is required.
- `email` must be a valid email.
- `password` must be at least 8 characters.
- `role` is optional, default is `mahasiswa`. Can be `mahasiswa`, `mitra`, or `admin`.

Response `201 Created`:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "role": "mahasiswa",
      "is_active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### POST `/api/auth/login`

Authenticate a user and obtain tokens.

```json
{
  "email": "budi@example.com",
  "password": "password123"
}
```

Response `200 OK`:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "<jwt_access_token>",
    "refreshToken": "<jwt_refresh_token>",
    "user": {
      "id": "uuid",
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "role": "mahasiswa",
      "is_active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### POST `/api/auth/refresh`

Obtain a new access token using a valid refresh token.

```json
{
  "refreshToken": "<jwt_refresh_token>"
}
```

### POST `/api/auth/logout` 🔐

Revoke the current refresh token.

Headers:

```txt
Authorization: Bearer <access_token>
```

Request body:

```json
{
  "refreshToken": "<jwt_refresh_token>"
}
```

## Profile Endpoints

### GET `/api/auth/profile` 🔐

Retrieve the authenticated user's profile.

Headers:

```txt
Authorization: Bearer <access_token>
```

Response `200 OK`:

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "role": "mahasiswa",
      "is_active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### PUT `/api/auth/profile` 🔐

Update the authenticated user's profile.

Headers:

```txt
Authorization: Bearer <access_token>
```

Example request:

```json
{
  "name": "Budi Santoso Updated",
  "password": "newpassword123"
}
```

Notes:

- `name` and `password` are optional.
- Role cannot be changed through this endpoint.

## User Roles

| Role | Description |
|------|-------------|
| `mahasiswa` | Mahasiswa yang melakukan bidding dan mengerjakan proyek |
| `mitra` | Mitra industri/perusahaan yang menyediakan proyek |
| `admin` | Administrator platform (panitia/dosen) |
