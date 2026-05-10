# API Documentation

Folder ini berisi dokumentasi lengkap untuk API Identity & SSO Service.

## File

### `swagger.yml`
OpenAPI 3.0 specification untuk semua endpoint service.

**Cara menggunakan:**

#### 1. Swagger UI (Online)
Buka di browser: https://editor.swagger.io/

Lalu:
1. Pilih **File** → **Import File** → pilih `swagger.yml`
2. Atau copy-paste isi `swagger.yml` ke editor

#### 2. Swagger UI (Local dengan Docker)
```bash
docker run -p 8080:8080 \
  -v $(pwd)/docs:/data \
  -e SWAGGER_FILE=/data/swagger.yml \
  swaggerapi/swagger-ui
```
Lalu buka: http://localhost:8080

#### 3. Dengan Redoc (Dokumentasi alternatif)
```bash
docker run -p 8080:8080 \
  -v $(pwd)/docs:/data \
  -e SPEC_URL=/data/swagger.yml \
  redocly/redoc
```
Lalu buka: http://localhost:8080

#### 4. Di Postman
1. Buka Postman
2. **File** → **Import** → **Link** → paste URL ke `swagger.yml`
3. Atau **File** → **Import** → **Upload File** → pilih `swagger.yml`

#### 5. Akun Uji Postman
Gunakan akun ini untuk testing login dan endpoint protected:

- Email: `test@example.com`
- Name: `Test User`
- Password: `Password123!`
- Role: `talent`

Untuk flow admin:

- Admin email: `admin@example.com`
- Admin password: `Password123!`

Catatan: endpoint login tetap menggunakan `email` dan `password`; field `name` dan `role` dipakai saat register.

Jika kamu memakai Postman environment, simpan variabel berikut:

- `baseUrl` → `http://localhost:3000`
- `email` → `test@example.com`
- `password` → `Password123!`
- `name` → `Test User`
- `role` → `talent`
- `googleIdToken` → isi jika ingin tes Google OAuth
- `accessToken` → isi setelah login
- `refreshToken` → isi setelah login
- `adminEmail` → `admin@example.com`
- `adminPassword` → `Password123!`
- `adminAccessToken` → isi setelah admin login
- `adminRefreshToken` → isi setelah admin login
- `userId` → bisa diisi dari response login/register
- `adminUserId` → bisa diisi dari response admin login
- `targetUserId` → user yang ingin dideactivate
- `internalApiKey` → isi sesuai `.env`
- `auditUserId` → opsional untuk filter audit logs
- `auditAction` → opsional untuk filter audit logs
- `auditLimit` → opsional untuk filter audit logs

## Testing dengan Swagger UI

1. Buka `swagger.yml` di Swagger Editor
2. Klik endpoint yang ingin ditest
3. Klik **Try it out**
4. Isi request body / parameter
5. Klik **Execute**

### Catatan Testing
- Endpoint public (login, register, refresh) bisa ditest langsung
- Endpoint protected memerlukan Bearer token dari login
- Endpoint internal memerlukan akses Docker network

## Postman Collection

File `postman-collection.json` dan `postman-environment.json` sudah disiapkan untuk memudahkan pengujian.

Langkah singkat menjalankan di Postman:

1. Impor environment terlebih dahulu:
  - Postman → Import → pilih `postman-environment.json`
2. Impor collection:
  - Postman → Import → pilih `postman-collection.json`
3. Pilih environment yang baru di kanan-atas (dropdown environment)
4. Buka `Authentication -> Login User` → klik Send
5. Buka ikon mata (Environment quick look) untuk memastikan `accessToken` dan `refreshToken` sudah terisi
6. Jalankan request di `Protected` (mis. `Get Profile`) — header Authorization sudah terkonfigurasi sebagai `Bearer {{accessToken}}`
7. Untuk menguji seluruh flow, gunakan Collection Runner (Runner) dan pilih environment yang sesuai

Contoh Test script (Login) yang tersimpan di koleksi untuk menyimpan token ke environment:

```javascript
const json = (() => { try { return pm.response.json(); } catch(e) { return null; } })();
pm.test('Response status is 200 or 201', function () { pm.expect(pm.response.code).to.be.oneOf([200,201]); });
if (json) {
  const access = (json.data && json.data.accessToken) || json.accessToken || '';
  const refresh = (json.data && json.data.refreshToken) || json.refreshToken || '';
  const uid = (json.data && (json.data.user && json.data.user.id)) || json.userId || json.id || '';
  if (access) pm.environment.set('accessToken', access);
  if (refresh) pm.environment.set('refreshToken', refresh);
  if (uid) pm.environment.set('userId', uid);
}
```

Header Authorization di request protected (contoh) di-set sebagai:

```
Authorization: Bearer {{accessToken}}
```

Catatan:
- Pastikan `baseUrl` di environment menunjuk ke service yang sedang berjalan (default: `http://localhost:3000`).
- Jika service belum diimplementasikan, request akan mengembalikan error koneksi atau 404.
- Jika ingin otomatis refresh token saat expired, saya bisa tambahkan pre-request script di tingkat koleksi.

## Contoh Request/Response (akan datang)

Folder `examples/` akan berisi:
- Contoh request untuk tiap endpoint
- Contoh response success dan error
- Scenario testing lengkap

## Referensi

- [ENDPOINTS.md](../ENDPOINTS.md) - Inventory endpoint lengkap
- [README.md](../README.md) - Overview service
- [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md) - Guide integrasi antar service