# Identity & SSO Service (Auth Service)

Service **Identity & SSO** berperan sebagai *gatekeeper* untuk autentikasi dan pengelolaan profil user di ekosistem microservices.

Repo ini berisi implementasi **auth-service** berbasis **Node.js (Express)** dengan **PostgreSQL** (via Sequelize) dan autentikasi menggunakan **JWT (access + refresh token)**.

> Catatan: berdasarkan `INTEGRATION_GUIDE.md`, service ini saat ini menyediakan **MOCK MODE** untuk kebutuhan integrasi awal antar service.

---

## Ringkasan Tanggung Jawab (Kelompok 1 — The Gatekeeper)

- Autentikasi user (role yang tersedia: `client`, `freelancer`, `admin`).
- Mengelola profil user (lihat & update profil sendiri).
- Mengeluarkan dan memvalidasi **JWT Access Token** untuk dipakai service lain.
- Mengelola **Refresh Token** (disimpan ke database) untuk proses *refresh* access token.

Arsitektur service mengikuti pendekatan **layered (N-tier)** secara praktis:

- **Routes**: `src/routes/*`
- **Controllers**: `src/controllers/*`
- **Middlewares**: `src/middlewares/*`
- **Models (Data layer)**: `src/models/*` (Sequelize)

---

## Teknologi

- **Runtime**: Node.js 20
- **Framework**: Express
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Security middleware**: Helmet, CORS
- **Auth**: JSON Web Token (JWT)
- **Containerization**: Docker & Docker Compose

---

## Struktur Repo

- `services/auth-service` — service utama Identity & SSO
- `services/template-service` — contoh/template untuk membuat service baru
- `docker-compose.yml` — menjalankan postgres + service-service di local
- `INTEGRATION_GUIDE.md` — panduan integrasi untuk service lain
- `.env.example` — contoh environment root untuk Docker Compose

---

## Menjalankan dengan Docker Compose (Disarankan)

1. Buat file `.env` dari contoh:

```bash
cp .env.example .env
```

2. Jalankan semua service:

```bash
docker compose up --build -d
```

3. Cek health endpoint:

- Auth service: `GET http://localhost:3001/health`

4. Lihat log:

```bash
docker compose logs -f auth-service
```

> Port mapping penting: auth-service diexpose ke host di **3001** (container port 3000). Lihat `docker-compose.yml`.

---

## Menjalankan Tanpa Docker (Auth Service saja)

> Untuk mode ini, pastikan PostgreSQL sudah berjalan dan database `auth_db` tersedia.

```bash
cd services/auth-service
cp .env.example .env
npm install
npm run dev
```

Auth service default berjalan di `http://localhost:3000` (sesuai `PORT` di `.env`).

---

## Environment Variables

### Root `.env` (untuk Docker Compose)

Lihat `.env.example` di root repo:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`
- `AUTH_DB_NAME`
- `JWT_SECRET`
- `NODE_ENV`

### Auth service `.env` (untuk run tanpa Docker)

Lihat `services/auth-service/.env.example`:

- `PORT`, `NODE_ENV`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES`

---

## API Endpoints

Base path: `/api`

### Public Endpoints

- `POST /api/auth/register` — daftar akun baru
- `POST /api/auth/login` — login dan dapatkan token
- `POST /api/auth/refresh` — perbarui access token

### Protected Endpoints (butuh Bearer token)

Header:

```http
Authorization: Bearer <accessToken>
```

- `POST /api/auth/logout` — logout (hapus refresh token)
- `GET /api/auth/profile` — lihat profil sendiri
- `PUT /api/auth/profile` — update profil sendiri

Untuk detail payload/response dan contoh integrasi antar-service, baca:

- **`INTEGRATION_GUIDE.md`**

---

## Konsep Token (untuk Service Lain)

Prinsip integrasi yang dipakai di repo ini:

- Token **JWT** berisi informasi user (`id`, `email`, `role`).
- Service lain cukup melakukan **verifikasi JWT secara lokal** menggunakan `JWT_SECRET` yang sama.
- Tidak perlu memanggil auth-service setiap request.

---

## Status Saat Ini: MOCK MODE

Dokumen integrasi menyatakan auth-service belum live penuh, namun mock endpoint & mock users tersedia untuk testing.

Lihat bagian **"Status Saat Ini: MOCK MODE"** di `INTEGRATION_GUIDE.md` untuk daftar user uji dan skenario mock.

---

## Checklist Portofolio (Mengacu Kebutuhan Penilaian)

- [x] Link repository GitHub
- [x] Dockerfile & Docker Compose (`services/auth-service/Dockerfile`, `docker-compose.yml`)
- [x] Dokumentasi integrasi antar service (`INTEGRATION_GUIDE.md`)
- [ ] Dokumentasi API (Swagger / Postman) — *belum ada di repo, dapat ditambahkan*
- [ ] Diagram arsitektur — *belum ada di repo, dapat ditambahkan*
- [ ] Tracking progress (Trello) — di luar repo

---

## Lisensi

Lihat file `LICENSE`.
