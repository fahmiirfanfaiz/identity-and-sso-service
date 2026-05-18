# Testing Results — Identity & SSO Service

## Overview
- Date: 2026-05-12
- Base URL: http://localhost:3000
- Node: dev server running via `npm run dev`
- Purpose: capture detailed request/response behavior for Test Group 2 (Authentication Error Cases) to be used for docs and Swagger examples

## How to reproduce (local)

1. Start services (Postgres + Redis + app):

```powershell
docker compose up -d
npx prisma db push
npm run dev
```

2. Clear login rate-limit keys (Redis) before repeating rate-limit tests:

```powershell
docker exec identity-redis sh -lc "redis-cli --scan --pattern '*login*' | xargs -r redis-cli del"
```

3. Example curl payloads used for tests (valid JSON and malformed JSON):

Valid (wrong credentials):

```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  --data '{"email":"test@example.com","password":"WrongPassword123!"}'
```

Malformed JSON (demonstrates parser error):

```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  --data '{email: test@example.com, password: WrongPassword123!}'
```

---

## Test Group 2 — Detailed Results

### 2.1 Invalid login (wrong credentials)

- Endpoint: `POST /api/auth/login`
- Purpose: verify service returns authentication failure for incorrect password or inactive/missing user
- Request used: valid JSON (see above)
- Expected (per implementation):

  - Status: `401 Unauthorized`
  - Body (JSON):

```json
{
  "success": false,
  "message": "Invalid credentials or account is inactive"
}
```

- Observed (manual run):

  - When request body was valid JSON and Redis rate-limiter cleared prior to test: `401` observed. The service's error message is defined in `src/services/auth.service.ts` as `Invalid credentials or account is inactive`.
  - If request body is malformed JSON, the body-parser returns `400 Bad Request` with a parser error message (see section 2.1.1 below).

Notes: use proper JSON encoding in clients (Postman/Fetch/axios) to avoid getting a 400 from the JSON parser instead of the authentication flow.

#### 2.1.1 Malformed JSON edge-case

- Observed response for malformed payload:

  - Status: `400 Bad Request`
  - Body (example captured):

```json
{
  "success": false,
  "message": "Expected property name or '}' in JSON at position 1 (line 1 column 2)",
  "stack": "SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)\n    at JSON.parse (<anonymous>)\n    ..."
}
```

This response originates from the JSON parser middleware and should be considered an input validation error, not an auth logic error.

---

### 2.2 Access profile without token

- Endpoint: `GET /api/auth/profile`
- Purpose: ensure protected endpoints require Authorization header
- Request used:

```bash
curl -i http://localhost:3000/api/auth/profile
```

- Observed:

  - Status: `401 Unauthorized`
  - Body (JSON):

```json
{
  "success": false,
  "message": "Unauthorized: No token provided"
}
```

- Source: `src/middlewares/authenticate.ts`

Notes: client apps must include `Authorization: Bearer <accessToken>` header for protected calls.

---

### 2.3 Access profile with invalid or expired token

- Endpoint: `GET /api/auth/profile`
- Purpose: verify token validation path
- Request used:

```bash
curl -i http://localhost:3000/api/auth/profile -H "Authorization: Bearer eyJhbGciOi...invalid"
```

- Observed:

  - Status: `401 Unauthorized`
  - Body (JSON):

```json
{
  "success": false,
  "message": "Unauthorized: Invalid or expired token"
}
```

- Source: `src/middlewares/authenticate.ts`

Notes: token validation failures are handled uniformly; expired tokens should be refreshed via `POST /api/auth/refresh`.

---

### 2.4 Rate limit on login

- Endpoint: `POST /api/auth/login`
- Purpose: ensure brute-force protection via Redis-backed limiter
- Limiter configuration (per code): `windowMs = 15 * 60 * 1000` (15 minutes), `max = 10` attempts per IP
- Reproduction steps:

  1. Clear limiter keys in Redis (see reproduce step 2 above).
  2. Send the invalid login payload 11 times quickly.

- Observed behaviour:

  - Attempts 1..10: services responded with `401` for invalid credentials (auth path)
  - Attempt 11 (exceeding limit): `429 Too Many Requests`

- 429 Body (per code):

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "retryAfter": 899
}
```

Notes: `retryAfter` is calculated from Redis TTL and returned in seconds.

---

## Conclusions and recommendations

- `ENDPOINTS.md` contains concise, human-friendly summaries per endpoint; detailed reproductions and raw responses live in this file (`docs/TESTING_RESULTS.md`) to keep `ENDPOINTS.md` readable while preserving a source of truth for QA and Swagger updates.
- Actionable next steps:
  - Update `docs/openapi.yml` response examples for the affected endpoints with the verified JSON examples above.
  - Proceed to Test Group 3 (Admin + Internal) and capture its responses in this same document.

  ---

  ## Test Group 3 — Admin & Internal (detailed results)

  ### 3.1 Register Admin (attempt)

  - Endpoint: `POST /api/auth/register/admin`
  - Request used (example):

  ```bash
  curl -i -X POST http://localhost:3000/api/auth/register/admin \
    -H 'Content-Type: application/json' \
    -d '{"name":"Admin Test","email":"admin@example.com","password":"Password123!","role":"admin"}'
  ```

  - Observed:
    - Status: `400 Bad Request` (example in this session showed a JSON parser error when body was malformed)
    - Note: This endpoint is protected (requires an authenticated admin). To create an admin via this route you must supply a valid admin `Authorization: Bearer <token>` header.

  ### 3.2 Login Admin

  - Endpoint: `POST /api/auth/login`
  - Request used:

  ```bash
  curl -i -X POST http://localhost:3000/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@example.com","password":"Password123!"}'
  ```

  - Observed in this session: parser error (400) when payload was not valid JSON in some attempts. Ensure valid JSON. When valid, expected `200` with `accessToken` and `refreshToken`.

  ### 3.3 Deactivate user (admin-only)

  - Endpoint: `PATCH /api/auth/users/{id}/deactivate`
  - Notes: requires `Authorization: Bearer <adminAccessToken>` and `admin` role. In this session the step was skipped because no admin token was obtained automatically.

  ### 3.4 Internal — List users

  - Endpoint: `GET /internal/users`
  - Header required: `x-internal-api-key: change-this-internal-api-key`
  - Observed:

    - Status: `200 OK`
    - Body (excerpt):

  ```json
  {
    "success": true,
    "message": "Users retrieved",
    "data": {
      "users": [
        {
          "id": "0d919996-b82d-4448-b589-a0b11572caf5",
          "name": "Updated User",
          "email": "test@example.com",
          "role": "talent",
          "isActive": true
        }
      ],
      "total": 1
    }
  }
  ```

  Source: `src/controllers/internal.controller` / `src/services/internal.service`

  ### 3.5 Internal — Get user by ID

  - Endpoint: `GET /internal/users/{id}`
  - Observed:

    - Status: `200 OK`
    - Body (excerpt):

  ```json
  {
    "success": true,
    "message": "User found",
    "data": {
      "user": {
        "id": "0d919996-b82d-4448-b589-a0b11572caf5",
        "name": "Updated User",
        "email": "test@example.com",
        "role": "talent",
        "isActive": true
      }
    }
  }
  ```

  ### 3.6 Internal — Validate token

  - Endpoint: `POST /internal/validate-token`
  - Header required: `x-internal-api-key`
  - Observed: in this session token validation was skipped because no admin access token was extracted from login attempts; when supplied, expected `200` with decoded token info (user id, email, role, iat, exp).

  ### 3.7 Internal — Audit logs

  - Endpoint: `GET /internal/audit-logs?limit=10`
  - Observed:

    - Status: `200 OK`
    - Body contains recent audit entries, e.g. many `LOGIN_FAILED` events with IP and user-agent captured.

  Excerpt (trimmed):

  ```json
  {
    "success": true,
    "message": "Audit logs retrieved",
    "data": {
      "logs": [
        { "id": "04276ab1-...", "action": "LOGIN_FAILED", "userId": "0d919996-...", "ip": "::1", "userAgent": "WindowsPowerShell/...", "createdAt": "2026-05-12T15:29:01Z" },
        ...
      ],
      "total": 10
    }
  }
  ```

  ---

  ### Notes and next steps for Test Group 3

  - To fully exercise admin flows (create admin, deactivate user), obtain an admin account externally or seed one in the database, then login to get `adminAccessToken` and re-run the admin endpoints.
  - I recommend running the following sequence in Postman (with environment variables):

  ```text
  1) Login admin -> save adminAccessToken
  2) PATCH /api/auth/users/{{userId}}/deactivate with Authorization: Bearer {{adminAccessToken}}
  3) Verify user isActive=false via GET /internal/users/{{userId}}
  ```

  ---

  End of Test Group 3 results.

## Raw captures (excerpt)

- Example parser error capture (malformed JSON):

```json
{"success":false,"message":"Expected property name or '}' in JSON at position 1 (line 1 column 2)","stack":"SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)\n    at JSON.parse (<anonymous>)\n    at parse (...)")}
```

---

End of Test Group 2 results.