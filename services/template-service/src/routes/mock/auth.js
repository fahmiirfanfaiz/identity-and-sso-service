/**
 * MOCK AUTH ROUTES
 * ============================================
 * Endpoint ini mengembalikan data HARDCODED (tanpa database).
 * Dipakai oleh kelompok lain sementara auth-service belum selesai.
 *
 * ⚠️  HAPUS FILE INI setelah auth-service dari Nabil sudah live.
 * ============================================
 */
const { Router } = require('express');

const router = Router();

// ─── Mock Data ───────────────────────────────
const MOCK_USERS = [
  {
    id: 'mock-uuid-0001',
    name: 'Alice Mahasiswa',
    email: 'mahasiswa@mock.dev',
    role: 'mahasiswa',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'mock-uuid-0002',
    name: 'Bob Mitra',
    email: 'mitra@mock.dev',
    role: 'mitra',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'mock-uuid-0003',
    name: 'Admin User',
    email: 'admin@mock.dev',
    role: 'admin',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
];

// Fake JWT-like tokens (bukan JWT asli, hanya placeholder)
const MOCK_ACCESS_TOKEN =
  'mock.eyJpZCI6Im1vY2stdXVpZC0wMDAxIiwiZW1haWwiOiJtYWhhc2lzd2FAbW9jay5kZXYiLCJyb2xlIjoibWFoYXNpc3dhIn0.mock_signature';
const MOCK_REFRESH_TOKEN =
  'mock_refresh.eyJpZCI6Im1vY2stdXVpZC0wMDAxIn0.mock_refresh_signature';

// ─── POST /api/auth/register ─────────────────
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  // Validasi field wajib
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [
        !name && { field: 'name', message: 'Name is required' },
        !email && { field: 'email', message: 'Email is required' },
        !password && { field: 'password', message: 'Password is required' },
      ].filter(Boolean),
    });
  }

  // Simulasi email sudah terdaftar
  if (email === 'exists@mock.dev') {
    return res.status(409).json({
      success: false,
      message: 'Email already registered',
    });
  }

  return res.status(201).json({
    success: true,
    message: '[MOCK] User registered successfully',
    data: {
      user: {
        id: 'mock-uuid-' + Date.now(),
        name,
        email,
        role: 'mahasiswa',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    },
    _mock: true,
  });
});

// ─── POST /api/auth/login ────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [
        !email && { field: 'email', message: 'Email is required' },
        !password && { field: 'password', message: 'Password is required' },
      ].filter(Boolean),
    });
  }

  // Simulasi wrong password
  if (password === 'wrong') {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Cari user mock berdasarkan email, fallback ke user pertama
  const user = MOCK_USERS.find((u) => u.email === email) || MOCK_USERS[0];

  return res.status(200).json({
    success: true,
    message: '[MOCK] Login successful',
    data: {
      accessToken: MOCK_ACCESS_TOKEN,
      refreshToken: MOCK_REFRESH_TOKEN,
      user,
    },
    _mock: true,
  });
});

// ─── POST /api/auth/refresh ──────────────────
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required',
    });
  }

  // Simulasi token invalid
  if (refreshToken === 'invalid') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }

  return res.status(200).json({
    success: true,
    message: '[MOCK] Token refreshed successfully',
    data: {
      accessToken: MOCK_ACCESS_TOKEN + '_refreshed',
    },
    _mock: true,
  });
});

// ─── POST /api/auth/logout ───────────────────
router.post('/logout', (req, res) => {
  return res.status(200).json({
    success: true,
    message: '[MOCK] Logged out successfully',
    _mock: true,
  });
});

// ─── GET /api/auth/profile ───────────────────
router.get('/profile', (req, res) => {
  // Cek header Authorization (tidak diverifikasi, hanya dicek keberadaannya)
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }

  return res.status(200).json({
    success: true,
    message: '[MOCK] Profile retrieved',
    data: {
      user: MOCK_USERS[0],
    },
    _mock: true,
  });
});

// ─── PUT /api/auth/profile ───────────────────
router.put('/profile', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }

  const { name } = req.body;

  return res.status(200).json({
    success: true,
    message: '[MOCK] Profile updated successfully',
    data: {
      user: {
        ...MOCK_USERS[0],
        name: name || MOCK_USERS[0].name,
        updated_at: new Date().toISOString(),
      },
    },
    _mock: true,
  });
});

module.exports = router;
