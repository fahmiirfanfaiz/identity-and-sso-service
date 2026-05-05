/**
 * MOCK INTERNAL ROUTES
 * ============================================
 * Endpoint ini untuk komunikasi antar service (service-to-service).
 * Di production, internal routes TIDAK diekspos ke publik.
 * Untuk sekarang, semua boleh akses untuk keperluan development.
 *
 * ⚠️  HAPUS FILE INI setelah auth-service dari Nabil sudah live.
 * ============================================
 */
const { Router } = require('express');

const router = Router();

// ─── Mock Users (sama dengan di auth.js) ─────
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

// ─── GET /internal/users/:id ─────────────────
// Dipakai service lain untuk ambil data user berdasarkan ID
router.get('/users/:id', (req, res) => {
  const { id } = req.params;

  const user = MOCK_USERS.find((u) => u.id === id);

  if (!user) {
    // Kalau ID tidak ada di mock, return user pertama sebagai fallback
    return res.status(200).json({
      success: true,
      message: '[MOCK] User found (fallback)',
      data: {
        user: { ...MOCK_USERS[0], id },
      },
      _mock: true,
    });
  }

  return res.status(200).json({
    success: true,
    message: '[MOCK] User found',
    data: { user },
    _mock: true,
  });
});

// ─── POST /internal/validate-token ───────────
// Dipakai service lain yang tidak mau verify JWT lokal
router.post('/validate-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required',
    });
  }

  // Simulasi token invalid
  if (token === 'invalid') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }

  return res.status(200).json({
    success: true,
    message: '[MOCK] Token is valid',
    data: {
      user: {
        id: 'mock-uuid-0001',
        email: 'mahasiswa@mock.dev',
        role: 'mahasiswa',
      },
    },
    _mock: true,
  });
});

// ─── GET /internal/users ─────────────────────
// List semua user (untuk kebutuhan admin service, opsional)
router.get('/users', (req, res) => {
  return res.status(200).json({
    success: true,
    message: '[MOCK] Users retrieved',
    data: {
      users: MOCK_USERS,
      total: MOCK_USERS.length,
    },
    _mock: true,
  });
});

module.exports = router;
