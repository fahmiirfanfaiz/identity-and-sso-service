# Dokumentasi Arsitektur — Identity & SSO Service

Dokumen ini berisi kumpulan diagram arsitektur sederhana untuk **Identity & SSO Service** (Kelompok 1, Project-Hub). Semua diagram menggunakan format **Mermaid** sehingga dapat dirender langsung di GitHub.

---

## Daftar Diagram

| # | Diagram | Deskripsi |
|---|---------|-----------|
| 1 | [C4 System Context](#1-c4-system-context) | Posisi auth-service dalam ekosistem Project-Hub |
| 2 | [C4 Container / Deployment](#2-c4-container--deployment) | Komponen runtime dan port mapping Docker |
| 3 | [Component Diagram](#3-component-diagram-auth-service) | Lapisan internal auth-service (layered architecture) |
| 4 | [Sequence Diagrams](#4-sequence-diagrams) | Alur register, login, refresh, logout, profile get/update |
| 5 | [ERD — Database](#5-erd--database) | Skema tabel `users` dan `refresh_tokens` |
| 6 | [Endpoint Map](#6-endpoint-map) | Peta endpoint publik vs protected |

---

## 1. C4 System Context

> **Apa ini?** Menunjukkan posisi Identity & SSO Service sebagai "gatekeeper" di ekosistem Project-Hub: siapa penggunanya, dan layanan mana saja yang bergantung padanya.

Identity & SSO Service (Kelompok 1) adalah **pintu masuk terpusat** bagi seluruh pengguna Project-Hub. Semua aktor (Mahasiswa, Mitra, Panitia/Dosen) harus melewati auth-service untuk mendapatkan **JWT Access Token**. Layanan lain (Lelang, Matchmaker, Tracker, Communication) memverifikasi token tersebut secara **lokal** menggunakan `JWT_SECRET` yang sama — sehingga tidak perlu memanggil auth-service setiap kali ada request.

**Komponen dalam diagram:**
- 👤 **Aktor**: Mahasiswa, Mitra, Panitia/Dosen, System Admin/DevOps
- 🔐 **Identity & SSO Service**: inti autentikasi dan manajemen profil
- 🌐 **Layanan lain**: Lelang (Kel. 2), Matchmaker (Kel. 3), Tracker (Kel. 4), Communication (Kel. 5)

```mermaid
flowchart TD
    subgraph Actors["👥 Pengguna / Aktor"]
        mahasiswa("👤 Mahasiswa\nPelaksana proyek")
        mitra("👤 Mitra\nPenyedia proyek")
        panitia("👤 Panitia / Dosen\nPengawas & auditor")
        sysadmin("👤 System Admin / DevOps\nInfrastruktur & monitoring")
    end

    auth["🔐 Identity & SSO Service\n―――――――――――――――――――\n• Register & login user\n• Issue JWT access + refresh token\n• Kelola profil user\n• Validasi token (opsional internal)"]

    subgraph Services["🌐 Layanan Lain — Project-Hub"]
        lelang["📋 Lelang Service\n(Kelompok 2)"]
        matchmaker["🤝 Matchmaker Service\n(Kelompok 3)"]
        tracker["📊 Tracker Service\n(Kelompok 4)"]
        communication["📨 Communication Service\n(Kelompok 5)"]
    end

    mahasiswa  -- "Register / Login / Profile" --> auth
    mitra      -- "Register / Login / Profile" --> auth
    panitia    -- "Register / Login / Profile" --> auth
    sysadmin   -- "Operasional & health-check"  --> auth

    mahasiswa  -. "Request + Bearer JWT" .-> Services
    mitra      -. "Request + Bearer JWT" .-> Services
    panitia    -. "Request + Bearer JWT" .-> Services

    Services   -- "Verifikasi JWT lokal\n(JWT_SECRET sama)" --> auth
```

---

## 2. C4 Container / Deployment

> **Apa ini?** Menunjukkan komponen runtime yang berjalan saat menggunakan Docker Compose: client, auth-service (Express), dan PostgreSQL — lengkap dengan port mapping dan jaringan Docker.

Saat dijalankan dengan `docker compose up`, terdapat tiga komponen utama yang saling terhubung dalam jaringan Docker bernama `bidding-network`. Auth-service berjalan di **container port 3000** dan diekspos ke host di **port 3001**. PostgreSQL berjalan di port standar 5432. Tidak ada Redis karena tidak digunakan di kode ini.

**Komponen dalam diagram:**
- 💻 **Client** (browser/aplikasi mobile)
- 🟩 **auth-service** (Express, Node.js 20, container `bidding-auth-service`)
- 🐘 **PostgreSQL 16** (container `bidding-postgres`, database `auth_db`)

```mermaid
flowchart LR
    client("💻 Client\nBrowser / Mobile App")

    subgraph DockerCompose["🐳 Docker Compose — bidding-network"]
        authService["🟩 auth-service\n――――――――――――――――――\nContainer: bidding-auth-service\nRuntime: Node.js 20 + Express\nPort: 3000 (container)\n       3001 (host)\nEnv: JWT_SECRET, DB_*, PORT"]

        postgres["🐘 PostgreSQL 16\n――――――――――――――――――\nContainer: bidding-postgres\nDatabase: auth_db\nPort: 5432\nTabel: users, refresh_tokens"]
    end

    client       -- "HTTP\nlocalhost:3001" --> authService
    authService  -- "Sequelize ORM\n(postgres://postgres:5432/auth_db)" --> postgres
```

**Port mapping ringkas:**

| Komponen | Port Host | Port Container |
|----------|-----------|----------------|
| auth-service | **3001** | 3000 |
| PostgreSQL | **5432** | 5432 |

---

## 3. Component Diagram (auth-service)

> **Apa ini?** Menunjukkan lapisan-lapisan internal auth-service dan dependensi antar komponennya — dari entry point hingga database.

Auth-service menggunakan **layered (N-tier) architecture**: setiap HTTP request masuk melalui `app.js`, diteruskan ke **Routes** yang mengatur mapping endpoint, kemudian melewati **Middlewares** (validasi, autentikasi), lalu diproses oleh **Controller**. Controller berinteraksi dengan **Models** (Sequelize) untuk operasi database, menggunakan **Utils** untuk operasi JWT, dan membaca konfigurasi dari **Config**.

**Lapisan dan file nyata:**

| Lapisan | File |
|---------|------|
| Entry point | `server.js`, `app.js` |
| Routes | `routes/index.js`, `routes/auth.js` |
| Middlewares | `middlewares/authenticate.js`, `middlewares/authorize.js`, `middlewares/errorHandler.js` |
| Controllers | `controllers/authController.js` |
| Models | `models/User.js`, `models/RefreshToken.js`, `models/index.js` |
| Utils | `utils/jwt.js` |
| Config | `config/index.js`, `config/database.js` |

```mermaid
flowchart TD
    client("💻 Client")

    subgraph AuthService["🟩 auth-service"]
        server["server.js\n(Entry Point)"]
        app["app.js\n(Express Setup:\nhelmet, cors, morgan,\njson parser)"]

        subgraph Routes["📡 Routes"]
            routeIndex["routes/index.js\nMount /auth"]
            routeAuth["routes/auth.js\nPOST /register\nPOST /login\nPOST /refresh\nPOST /logout\nGET  /profile\nPUT  /profile"]
        end

        subgraph Middlewares["🛡️ Middlewares"]
            authenticate["authenticate.js\nVerify Bearer JWT\n→ req.user"]
            authorize["authorize.js\nRole-based access\ncontrol (RBAC)"]
            errorHandler["errorHandler.js\nnotFoundHandler\nerrorHandler"]
            validation["express-validator\n(inline di auth.js)"]
        end

        subgraph Controllers["⚙️ Controllers"]
            authCtrl["authController.js\nregister()\nlogin()\nrefreshToken()\nlogout()\ngetProfile()\nupdateProfile()"]
        end

        subgraph Models["🗄️ Models (Sequelize)"]
            userModel["User.js\nTabel: users\nHook: bcrypt hash\nMethod: comparePassword()"]
            refreshModel["RefreshToken.js\nTabel: refresh_tokens\nRelasi: belongsTo User"]
            modelIndex["models/index.js\nAuto-load & setup\nassociations"]
        end

        subgraph Utils["🔧 Utils"]
            jwtUtil["jwt.js\ngenerateAccessToken()\ngenerateRefreshToken()\nverifyAccessToken()\nverifyRefreshToken()"]
        end

        subgraph Config["⚙️ Config"]
            configIndex["config/index.js\nport, nodeEnv,\ndb.*, jwt.*"]
        end
    end

    postgres[("🐘 PostgreSQL\nauth_db")]

    client      --> server
    server      --> app
    app         --> routeIndex
    routeIndex  --> routeAuth
    routeAuth   --> validation
    routeAuth   --> authenticate
    routeAuth   --> authCtrl
    authenticate --> jwtUtil
    authCtrl    --> userModel
    authCtrl    --> refreshModel
    authCtrl    --> jwtUtil
    authCtrl    --> configIndex
    modelIndex  --> userModel
    modelIndex  --> refreshModel
    userModel   --> postgres
    refreshModel --> postgres
    jwtUtil     --> configIndex
    app         --> errorHandler
```

---

## 4. Sequence Diagrams

> **Apa ini?** Menunjukkan alur langkah demi langkah untuk setiap operasi utama — siapa memanggil siapa, dalam urutan apa, dan apa yang dikembalikan.

### 4a. Register

Pengguna mengirimkan data diri, sistem memvalidasi input, mengecek duplikasi email, membuat akun baru (password di-*hash* otomatis via Sequelize hook), dan mengembalikan data user tanpa password.

```mermaid
sequenceDiagram
    participant C as 💻 Client
    participant R as routes/auth.js
    participant V as express-validator
    participant Ctrl as authController
    participant U as User (Model)
    participant DB as 🐘 PostgreSQL

    C->>R: POST /api/auth/register<br/>{name, email, password, role?}
    R->>V: registerValidation<br/>(name, email, password, role)
    V-->>Ctrl: validationResult(req)

    alt Validasi gagal
        Ctrl-->>C: 422 { errors: [...] }
    end

    Ctrl->>U: User.unscoped().findOne({email})
    U->>DB: SELECT * FROM users WHERE email=?
    DB-->>U: result

    alt Email sudah terdaftar
        Ctrl-->>C: 409 { message: "Email already registered" }
    end

    Ctrl->>U: User.create({name, email, password, role})
    Note over U: beforeCreate hook:<br/>bcrypt.hash(password, 12)
    U->>DB: INSERT INTO users ...
    DB-->>U: user row

    Ctrl->>U: User.findByPk(user.id)
    Note over U: defaultScope excludes password
    U->>DB: SELECT (tanpa password)
    DB-->>U: safeUser

    Ctrl-->>C: 201 { success: true,<br/>data: { user: safeUser } }
```

### 4b. Login

Pengguna mengirimkan email dan password. Sistem memverifikasi kredensial, meng-generate JWT access token (berlaku 15 menit) dan refresh token (berlaku 7 hari), lalu menyimpan refresh token ke database.

```mermaid
sequenceDiagram
    participant C as 💻 Client
    participant R as routes/auth.js
    participant Ctrl as authController
    participant U as User (Model)
    participant RT as RefreshToken (Model)
    participant J as utils/jwt.js
    participant DB as 🐘 PostgreSQL

    C->>R: POST /api/auth/login<br/>{email, password}
    R->>Ctrl: loginValidation → login()

    Ctrl->>U: User.scope('withPassword').findOne({email})
    U->>DB: SELECT * FROM users WHERE email=?
    DB-->>U: user (dengan password hash)

    alt User tidak ditemukan atau is_active=false
        Ctrl-->>C: 401 { message: "Invalid credentials..." }
    end

    Ctrl->>U: user.comparePassword(password)
    Note over U: bcrypt.compare(plain, hash)

    alt Password salah
        Ctrl-->>C: 401 { message: "Invalid credentials..." }
    end

    Ctrl->>J: generateAccessToken({id, email, role})
    J-->>Ctrl: accessToken (exp: 15m)

    Ctrl->>J: generateRefreshToken({id})
    J-->>Ctrl: refreshToken (exp: 7d)

    Ctrl->>RT: RefreshToken.create({user_id, token, expires_at})
    RT->>DB: INSERT INTO refresh_tokens ...

    Ctrl->>U: User.findByPk(user.id)
    U->>DB: SELECT (tanpa password)
    DB-->>U: safeUser

    Ctrl-->>C: 200 { accessToken,<br/>refreshToken, user: safeUser }
```

### 4c. Refresh Token

Client mengirimkan refresh token untuk mendapatkan access token baru tanpa harus login ulang. Sistem memverifikasi tanda tangan JWT, mengecek token di database, dan meng-generate access token baru.

```mermaid
sequenceDiagram
    participant C as 💻 Client
    participant Ctrl as authController
    participant J as utils/jwt.js
    participant RT as RefreshToken (Model)
    participant U as User (Model)
    participant DB as 🐘 PostgreSQL

    C->>Ctrl: POST /api/auth/refresh<br/>{refreshToken}

    alt Token tidak dikirim
        Ctrl-->>C: 400 { message: "Refresh token is required" }
    end

    Ctrl->>J: verifyRefreshToken(token)
    Note over J: jwt.verify(token, JWT_SECRET)

    alt JWT signature invalid / expired
        Ctrl-->>C: 401 { message: "Invalid or expired refresh token" }
    end

    Ctrl->>RT: RefreshToken.findOne({token, user_id: decoded.id})
    RT->>DB: SELECT * FROM refresh_tokens WHERE token=? AND user_id=?
    DB-->>RT: storedToken

    alt Token tidak ada di DB atau sudah expired
        Ctrl-->>C: 401 { message: "Refresh token not found or expired" }
    end

    Ctrl->>U: User.findByPk(decoded.id)
    U->>DB: SELECT * FROM users WHERE id=?
    DB-->>U: user

    alt User tidak ditemukan atau is_active=false
        Ctrl-->>C: 401 { message: "User not found or inactive" }
    end

    Ctrl->>J: generateAccessToken({id, email, role})
    J-->>Ctrl: newAccessToken (exp: 15m)

    Ctrl-->>C: 200 { accessToken: newAccessToken }
```

### 4d. Logout

Client mengirimkan access token (di header) dan refresh token (di body). Middleware authenticate memverifikasi access token terlebih dahulu, kemudian controller menghapus refresh token dari database sehingga tidak bisa digunakan lagi.

```mermaid
sequenceDiagram
    participant C as 💻 Client
    participant MW as authenticate.js
    participant Ctrl as authController
    participant RT as RefreshToken (Model)
    participant J as utils/jwt.js
    participant DB as 🐘 PostgreSQL

    C->>MW: POST /api/auth/logout<br/>Header: Authorization: Bearer <accessToken><br/>Body: {refreshToken}

    MW->>J: verifyAccessToken(token)
    J-->>MW: decoded payload

    alt Access token invalid
        MW-->>C: 401 { message: "Unauthorized: Invalid or expired token" }
    end

    MW->>Ctrl: next() — req.user = {id, email, role}

    Ctrl->>RT: RefreshToken.destroy({where: {token}})
    RT->>DB: DELETE FROM refresh_tokens WHERE token=?
    DB-->>RT: rows deleted

    Ctrl-->>C: 200 { success: true,<br/>message: "Logged out successfully" }
```

### 4e. Get Profile

Client mengirimkan access token untuk melihat data profilnya sendiri. Middleware authenticate memverifikasi token dan meng-inject `req.user`, lalu controller mengambil data user dari database.

```mermaid
sequenceDiagram
    participant C as 💻 Client
    participant MW as authenticate.js
    participant Ctrl as authController
    participant U as User (Model)
    participant J as utils/jwt.js
    participant DB as 🐘 PostgreSQL

    C->>MW: GET /api/auth/profile<br/>Header: Authorization: Bearer <accessToken>

    MW->>J: verifyAccessToken(token)
    J-->>MW: decoded {id, email, role}

    alt Token invalid
        MW-->>C: 401 Unauthorized
    end

    MW->>Ctrl: next() — req.user = {id, email, role}

    Ctrl->>U: User.findByPk(req.user.id)
    Note over U: defaultScope excludes password
    U->>DB: SELECT * FROM users WHERE id=?
    DB-->>U: user

    alt User tidak ditemukan
        Ctrl-->>C: 404 { message: "User not found" }
    end

    Ctrl-->>C: 200 { success: true,<br/>data: { user } }
```

### 4f. Update Profile

Client mengirimkan access token beserta field yang ingin diperbarui (`name` dan/atau `password`). Jika password diubah, Sequelize `beforeUpdate` hook otomatis meng-hash password baru sebelum disimpan.

```mermaid
sequenceDiagram
    participant C as 💻 Client
    participant MW as authenticate.js
    participant V as express-validator
    participant Ctrl as authController
    participant U as User (Model)
    participant J as utils/jwt.js
    participant DB as 🐘 PostgreSQL

    C->>MW: PUT /api/auth/profile<br/>Header: Authorization: Bearer <accessToken><br/>Body: {name?, password?}

    MW->>J: verifyAccessToken(token)
    J-->>MW: decoded {id, email, role}

    alt Token invalid
        MW-->>C: 401 Unauthorized
    end

    MW->>V: updateProfileValidation<br/>(name optional, password min 8)
    V-->>Ctrl: validationResult(req)

    alt Validasi gagal
        Ctrl-->>C: 422 { errors: [...] }
    end

    Ctrl->>U: User.scope('withPassword').findByPk(req.user.id)
    U->>DB: SELECT * FROM users WHERE id=?
    DB-->>U: user (dengan password)

    alt User tidak ditemukan
        Ctrl-->>C: 404 { message: "User not found" }
    end

    Note over Ctrl: Update field name dan/atau password

    Ctrl->>U: user.save()
    Note over U: beforeUpdate hook (jika password berubah):<br/>bcrypt.hash(password, 12)
    U->>DB: UPDATE users SET ... WHERE id=?

    Ctrl->>U: User.findByPk(user.id)
    Note over U: defaultScope excludes password
    U->>DB: SELECT (tanpa password)
    DB-->>U: updatedUser

    Ctrl-->>C: 200 { success: true,<br/>data: { user: updatedUser } }
```

---

## 5. ERD — Database

> **Apa ini?** Menunjukkan skema tabel database yang digunakan auth-service: struktur kolom, tipe data, dan relasi antar tabel.

Database `auth_db` hanya memiliki **dua tabel** yang dikelola Sequelize:
- **`users`**: menyimpan data akun pengguna. Password disimpan dalam bentuk *hash* bcrypt. Kolom `role` menggunakan PostgreSQL ENUM dengan nilai `client`, `freelancer`, atau `admin`.
- **`refresh_tokens`**: menyimpan refresh token yang aktif. Setiap user dapat memiliki banyak refresh token (misalnya login dari beberapa perangkat). Saat user dihapus, semua refresh token-nya ikut terhapus (`ON DELETE CASCADE`).

```mermaid
erDiagram
    users {
        UUID id PK "Primary key (UUIDV4)"
        VARCHAR name "NOT NULL"
        VARCHAR email "NOT NULL, UNIQUE"
        VARCHAR password "NOT NULL (bcrypt hash)"
        ENUM role "client | freelancer | admin, DEFAULT client"
        BOOLEAN is_active "NOT NULL, DEFAULT true"
        TIMESTAMP created_at "NOT NULL"
        TIMESTAMP updated_at "NOT NULL"
    }

    refresh_tokens {
        UUID id PK "Primary key (UUIDV4)"
        UUID user_id FK "NOT NULL → users.id"
        TEXT token "NOT NULL (JWT string)"
        TIMESTAMP expires_at "NOT NULL"
        TIMESTAMP created_at "NOT NULL"
        TIMESTAMP updated_at "NOT NULL"
    }

    users ||--o{ refresh_tokens : "hasMany (user_id, CASCADE)"
```

**Relasi:**
- `users` → `refresh_tokens`: **one-to-many** — satu user bisa punya banyak refresh token aktif (multi-device).
- `ON DELETE CASCADE`: jika user dihapus, semua refresh token-nya otomatis ikut terhapus.

---

## 6. Endpoint Map

> **Apa ini?** Peta ringkas semua endpoint yang tersedia di auth-service, dibagi menjadi endpoint **publik** (tanpa token) dan **protected** (butuh Bearer JWT).

Auth-service memiliki **3 endpoint publik** yang tidak memerlukan autentikasi, dan **3 endpoint protected** yang memerlukan `Authorization: Bearer <accessToken>` di header. Selain itu, terdapat 1 endpoint health-check.

```mermaid
flowchart TD
    client("💻 Client")

    subgraph Public["🌐 Public Endpoints\n(Tanpa autentikasi)"]
        register["POST /api/auth/register\nDaftar akun baru\n→ 201: user"]
        login["POST /api/auth/login\nLogin, dapat token\n→ 200: accessToken + refreshToken + user"]
        refresh["POST /api/auth/refresh\nPerbarui access token\n→ 200: accessToken baru"]
    end

    subgraph Protected["🔒 Protected Endpoints\n(Butuh: Authorization: Bearer &lt;accessToken&gt;)"]
        logout["POST /api/auth/logout\nLogout, hapus refresh token\n→ 200: success"]
        getProfile["GET /api/auth/profile\nLihat profil sendiri\n→ 200: user"]
        updateProfile["PUT /api/auth/profile\nUpdate nama / password\n→ 200: user (updated)"]
    end

    subgraph System["⚙️ System"]
        health["GET /health\nHealth-check service\n→ 200: status, uptime"]
        apiRoot["GET /api\nInfo versi API\n→ 200: welcome message"]
    end

    client --> Public
    client --> Protected
    client --> System

    authenticate{{"🛡️ authenticate.js\nVerify Bearer JWT"}}
    Protected --- authenticate
```

**Ringkasan endpoint:**

| Method | Path | Auth? | Deskripsi |
|--------|------|-------|-----------|
| `POST` | `/api/auth/register` | ❌ | Daftar akun baru |
| `POST` | `/api/auth/login` | ❌ | Login, dapatkan token |
| `POST` | `/api/auth/refresh` | ❌ | Perbarui access token |
| `POST` | `/api/auth/logout` | ✅ Bearer | Logout, hapus refresh token |
| `GET`  | `/api/auth/profile` | ✅ Bearer | Lihat profil sendiri |
| `PUT`  | `/api/auth/profile` | ✅ Bearer | Update profil sendiri |
| `GET`  | `/health` | ❌ | Health-check service |
| `GET`  | `/api` | ❌ | Info versi API |

---

## Referensi

- [README.md](../../README.md) — Dokumentasi utama & cara menjalankan service
- [INTEGRATION_GUIDE.md](../../INTEGRATION_GUIDE.md) — Panduan integrasi untuk service lain
- `services/auth-service/src/` — Source code auth-service
