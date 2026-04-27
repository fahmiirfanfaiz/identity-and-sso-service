# Auth Service - API Endpoints

Base URL: `http://localhost:3001/api/auth`

## Health Check

| Method | Path | Auth Required | Description |
|--------|------|:-------------:|-------------|
| GET | `/health` | No | Service health status |

## Authentication Endpoints

### POST `/api/auth/register`

Register a new `mahasiswa` or `mitra` account.

Example request for `mahasiswa`:

```json
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "password": "password123",
  "role": "mahasiswa",
  "nim": "21120122130001",
  "university": "Universitas Diponegoro",
  "major": "Informatika"
}
```

Example request for `mitra`:

```json
{
  "name": "Siti Rahma",
  "email": "siti@mitra.co.id",
  "password": "password123",
  "role": "mitra",
  "organizationName": "PT Mitra Inovasi",
  "organizationType": "Perusahaan"
}
```

Validation:

- `name` is required.
- `email` must be a valid email.
- `password` must be at least 8 characters.
- `role` must be `mahasiswa` or `mitra`.
- `mahasiswa` must provide `nim`, `university`, and `major`.
- `mitra` must provide `organizationName` and `organizationType`.

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
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "profile": {
        "type": "mahasiswa",
        "nim": "21120122130001",
        "university": "Universitas Diponegoro",
        "major": "Informatika"
      }
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
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "profile": {
        "type": "mahasiswa",
        "nim": "21120122130001",
        "university": "Universitas Diponegoro",
        "major": "Informatika"
      }
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

Response `200 OK` for `mitra`:

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Siti Rahma",
      "email": "siti@mitra.co.id",
      "role": "mitra",
      "is_active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "profile": {
        "type": "mitra",
        "organizationName": "PT Mitra Inovasi",
        "organizationType": "Perusahaan"
      }
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

Example request for `mahasiswa`:

```json
{
  "name": "Budi Santoso Updated",
  "major": "Sistem Informasi"
}
```

Example request for `mitra`:

```json
{
  "organizationType": "Startup"
}
```

Notes:

- `password` is optional and still supported.
- Role cannot be changed through this endpoint.
- Required role-specific profile fields must remain filled after update.

## User Roles

| Role | Description |
|------|-------------|
| `mahasiswa` | Student profile with `nim`, `university`, and `major` |
| `mitra` | Partner profile with `organizationName` and `organizationType` |
| `admin` | Reserved for platform administrator |
