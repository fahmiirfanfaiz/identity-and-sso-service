# API Endpoints Reference
# Identity & SSO Service - Kelompok 1

Dokumen ini adalah inventory lengkap semua endpoint yang direncanakan, sedang dibangun, atau sudah ada di service Kelompok 1.

**Update terakhir**: 5 Mei 2026  
**Status implementasi**: Prototipe / Early Stage

---

## Ringkasan Endpoint

| Kategori | Endpoint | Method | Status | Prioritas |
|----------|----------|--------|--------|-----------|
| Public | `/api/auth/register` | POST | planned | P0 |
| Public | `/api/auth/login` | POST | mock | P0 |
| Public | `/api/auth/refresh` | POST | mock | P1 |
| Protected | `/api/auth/logout` | POST | planned | P1 |
| Protected | `/api/auth/profile` | GET | planned | P0 |
| Protected | `/api/auth/profile` | PUT | planned | P1 |
| Internal | `/internal/users/:id` | GET | planned | P1 |
| Internal | `/internal/validate-token` | POST | planned | P2 |

---

## Public Endpoints (Tidak perlu autentikasi)

### 1. Register User
**Status**: `planned`  
**Priority**: P0  
**Kontrak**: Ada di [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "secure_password_123",
  "name": "John Doe",
  "role": "client|freelancer"
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": "Akun berhasil dibuat",
  "data": {
    "id": "uuid-user",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "client"
  }
}
```

**Response Error (409)**:
```json
{
  "success": false,
  "message": "Email sudah terdaftar",
  "errors": ["email"]
}
```

**Catatan validasi**:
- Email harus unik dan valid format
- Password minimal 8 karakter
- Role hanya boleh `client`, `freelancer`, atau `admin` (admin hanya bisa dibuat oleh admin)
- Name minimal 3 karakter

---

### 2. Login User
**Status**: `mock` (available untuk testing awal)  
**Priority**: P0  
**Kontrak**: Ada di [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "client@mock.dev",
  "password": "apa saja"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-user",
      "email": "client@mock.dev",
      "name": "Client Mock",
      "role": "client"
    }
  },
  "_mock": true
}
```

**Response Error (401)**:
```json
{
  "success": false,
  "message": "Email atau password salah",
  "errors": ["email", "password"]
}
```

**Mock Users untuk Testing**:
| Email | Password | Role | Notes |
|-------|----------|------|-------|
| `client@mock.dev` | apa saja | `client` | Mock user |
| `freelancer@mock.dev` | apa saja | `freelancer` | Mock user |
| `admin@mock.dev` | apa saja | `admin` | Mock user |
| `exists@mock.dev` | — | — | Simulasi 409 (conflict) |

---

### 3. Refresh Token
**Status**: `mock` (available untuk testing awal)  
**Priority**: P1  
**Kontrak**: Ada di [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

```http
POST /api/auth/refresh
Content-Type: application/json
```

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Token berhasil diperbarui",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error (401)**:
```json
{
  "success": false,
  "message": "Refresh token tidak valid atau expired",
  "errors": ["refreshToken"]
}
```

---

## Protected Endpoints (Perlu autentikasi)

Header yang diperlukan di semua endpoint protected:
```http
Authorization: Bearer <accessToken>
```

### 4. Logout User
**Status**: `planned`  
**Priority**: P1  

```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

**Request Body**: 
```json
{}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Logout berhasil, refresh token dihapus"
}
```

**Response Error (401)**:
```json
{
  "success": false,
  "message": "Token tidak valid atau sudah expired"
}
```

**Catatan**:
- Endpoint ini menghapus refresh token dari database
- User tidak bisa lagi menggunakan token untuk refresh

---

### 5. Get User Profile
**Status**: `planned`  
**Priority**: P0  

```http
GET /api/auth/profile
Authorization: Bearer <accessToken>
```

**Request Body**: Tidak ada

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Profil user berhasil diambil",
  "data": {
    "id": "uuid-user",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "freelancer",
    "is_active": true,
    "created_at": "2026-05-01T10:00:00Z",
    "updated_at": "2026-05-05T14:30:00Z"
  }
}
```

**Response Error (401)**:
```json
{
  "success": false,
  "message": "Token tidak valid atau sudah expired"
}
```

---

### 6. Update User Profile
**Status**: `planned`  
**Priority**: P1  

```http
PUT /api/auth/profile
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "John Updated",
  "password": "new_secure_password_123"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Profil berhasil diperbarui",
  "data": {
    "id": "uuid-user",
    "email": "john@example.com",
    "name": "John Updated",
    "role": "freelancer",
    "updated_at": "2026-05-05T15:45:00Z"
  }
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": ["name harus minimal 3 karakter", "password minimal 8 karakter"]
}
```

**Catatan**:
- User hanya bisa update profil milik diri sendiri
- Email tidak bisa diubah (untuk stabilitas)
- Role tidak bisa diubah oleh user sendiri

---

## Internal Endpoints (Service-to-service dalam Docker network)

Endpoint ini hanya bisa dipanggil dari dalam Docker network atau backend internal. **Tidak di-expose ke publik.**

Host untuk internal call: `http://auth-service:3000`

---

### 7. Get User by ID
**Status**: `planned`  
**Priority**: P1  

```http
GET /internal/users/:id
```

**URL Parameter**:
- `id` (string, uuid): User ID yang dicari

**Response Success (200)**:
```json
{
  "success": true,
  "message": "User ditemukan",
  "data": {
    "id": "uuid-user",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "freelancer",
    "is_active": true,
    "created_at": "2026-05-01T10:00:00Z"
  }
}
```

**Response Error (404)**:
```json
{
  "success": false,
  "message": "User tidak ditemukan"
}
```

**Contoh penggunaan dari service lain**:
```javascript
const axios = require('axios');

const getUserById = async (userId) => {
  const response = await axios.get(
    `http://auth-service:3000/internal/users/${userId}`
  );
  return response.data.data;
};
```

---

### 8. Validate Token
**Status**: `planned`  
**Priority**: P2  

```http
POST /internal/validate-token
Content-Type: application/json
```

**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Token valid",
  "data": {
    "id": "uuid-user",
    "email": "john@example.com",
    "role": "freelancer",
    "iat": 1714000000,
    "exp": 1714003600
  }
}
```

**Response Error (401)**:
```json
{
  "success": false,
  "message": "Token tidak valid atau sudah expired"
}
```

**Catatan**:
- Endpoint ini opsional. Service lain lebih disarankan memverifikasi token secara lokal dengan `JWT_SECRET` yang sama.
- Berguna jika ada service yang tidak mau setup JWT verification sendiri.

---

## Error Code & Status HTTP Standard

Semua endpoint mengikuti convention ini:

| Status | Meaning | Contoh Use Case |
|--------|---------|-----------------|
| 200 | OK | Request berhasil, operasi selesai |
| 201 | Created | Resource baru berhasil dibuat |
| 400 | Bad Request | Input tidak valid, validasi gagal |
| 401 | Unauthorized | Token tidak ada, invalid, atau expired |
| 403 | Forbidden | User tidak punya akses (role tidak sesuai) |
| 404 | Not Found | Resource tidak ditemukan |
| 409 | Conflict | Email/data sudah ada |
| 500 | Internal Server Error | Error di sisi server |

---

## Response Format Standard

Semua response harus mengikuti format ini (berlaku di seluruh ekosistem Project-Hub):

**Success**:
```json
{
  "success": true,
  "message": "Keterangan singkat",
  "data": { }
}
```

**Error**:
```json
{
  "success": false,
  "message": "Keterangan error",
  "errors": []
}
```

---

## JWT Token Structure

Access Token dan Refresh Token adalah JWT yang dibuat oleh service ini.

**Access Token Payload**:
```json
{
  "id": "uuid-user",
  "email": "user@example.com",
  "role": "client|freelancer|admin",
  "iat": 1714000000,
  "exp": 1714003600
}
```

**Access Token Expiry**: 15 menit (dapat dikonfigurasi via `JWT_ACCESS_EXPIRES` env)

**Refresh Token Expiry**: 7 hari (dapat dikonfigurasi via `JWT_REFRESH_EXPIRES` env)

---

## Field Validasi

### Email
- Format: Valid email address
- Unique: Ya (constraint database)
- Max length: 255 karakter
- Required: Ya

### Password
- Min length: 8 karakter
- Hashing: bcrypt dengan salt rounds 10
- Requirement: Tidak ada requirement khusus (bisa kombinasi apa saja)
- Required: Ya (saat register, opsional saat update)

### Name
- Min length: 3 karakter
- Max length: 100 karakter
- Required: Ya

### Role
- Valid values: `client`, `freelancer`, `admin`
- Default: Tidak ada, harus diberikan saat register
- Changeable: Hanya oleh admin

---

## Development Notes

### Status Kode
- `mock`: Endpoint sudah bisa ditest via mock mode, tapi belum ada implementasi penuh
- `planned`: Endpoint sudah dalam dokumentasi kontrak, akan diimplementasikan
- `in-progress`: Sedang dikoding oleh tim dev
- `done`: Sudah jadi dan bisa production

### Prioritas
- `P0`: Critical, harus ada untuk basic functionality
- `P1`: Important, harus ada dalam MVP
- `P2`: Nice-to-have, bisa ditambah kemudian

### Testing
- Untuk manual testing: gunakan Postman collection (akan tersedia)
- Untuk integrasi testing: gunakan mock endpoint terlebih dahulu
- Untuk load testing: lihat roadmap QA

---

## Changelog Endpoint

| Date | Change | Author |
|------|--------|--------|
| 2026-05-05 | Initial endpoint definition | Kelompok 1 |

---

## Referensi

- [README.md](README.md)
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- [docker-compose.yml](docker-compose.yml)
