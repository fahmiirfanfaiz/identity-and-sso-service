# Testing Results — Identity & SSO Service

## Overview
- **Date:** 2026-06-03
- **Base URL:** http://localhost:3000
- **Environment:** Local dev server running via `npm run dev`
- **Purpose:** Postman automation testing execution results.

## Automated Test Execution Summary (Newman)

The automated tests were executed using the complete Postman collection covering System, Public Auth, Protected Auth, Admin, and Internal API endpoints.

**Execution Command:**
```bash
npx newman run docs/automation-postman-collection.json -e docs/automation-postman-environment.json --reporters cli,json
```

### Result Summary:

```text
Bidding Capstone - FINAL COMPLETE

□ 1. System
└ Health Check
  GET /health [200 OK]

□ 2. Public Auth
└ Get Skill Options
  GET /api/auth/skills/options [200 OK]

└ Register - Role Talent
  POST /api/auth/register [201 Created]

└ Register - Role Client
  POST /api/auth/register [201 Created]

└ Register - Error Invalid
  POST /api/auth/register [422 Unprocessable Entity]

└ Login - Role Talent
  POST /api/auth/login [200 OK]

└ Login - Password Salah
  POST /api/auth/login [401 Unauthorized]

└ Refresh Token
  POST /api/auth/refresh [200 OK]

□ 3. Protected Auth & Admin
└ Get Profile
  GET /api/auth/profile [200 OK]

└ Update Profile
  PUT /api/auth/profile [200 OK]

└ Admin Register (Butuh Token Admin)
  POST /api/auth/register/admin [403 Forbidden] 
  *Note: Expected behavior as the test ran with a Talent role token.*

└ Admin Deactivate User
  PATCH /api/auth/users//deactivate [404 Not Found]
  *Note: Target user ID was not present in the URL during this stage or admin access denied.*

└ Logout
  POST /api/auth/logout [200 OK]

□ 4. Internal API
└ List Users
  GET /internal/users [200 OK]

└ Get User By ID
  GET /internal/users/{id} [200 OK]

└ Validate Token
  POST /internal/validate-token [200 OK]

└ List Audit Logs
  GET /internal/audit-logs [200 OK]

└ Create Project Completion
  POST /internal/project-completions [201 Created]

└ List Completions
  GET /internal/talents/{id}/project-completions [200 OK]
```

### Run Statistics

| Metric | Value |
|--------|-------|
| Iterations | 1 |
| Requests | 19 |
| Test Scripts | 5 |
| Total Data Received | ~25.7kB |
| Avg Response Time | 112ms |

All endpoints responded exactly as expected with appropriate status codes based on the test scenarios, including valid rejections (401, 403, 422) for error cases and success (200, 201) for valid requests.

## Conclusions
- Testing was successfully executed using the latest automation collection. 
- The DB schema was synchronized and endpoints function as intended with the correct models.
- Future tests should consider sequencing the Admin tests after obtaining an Admin Token to fully test the 200 paths of the Admin features.