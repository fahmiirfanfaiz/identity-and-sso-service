/**
 * Route Aggregator
 * Mount all route modules here.
 *
 * ⚠️  Mock routes aktif sementara auth-service belum live.
 *     Hapus bagian MOCK saat Nabil sudah selesai implementasi.
 */
const { Router } = require('express');

const router = Router();

// ─── [MOCK] Auth Routes ──────────────────────
// TODO: Hapus ini dan ganti dengan auth-service asli
const mockAuthRoutes = require('./mock/auth');
router.use('/auth', mockAuthRoutes);

// ─── Default route ───────────────────────────
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'identity-and-sso-service API',
    version: '1.0.0',
    mode: '[MOCK] — auth-service belum live',
    endpoints: {
      auth: {
        register:      'POST   /api/auth/register',
        login:         'POST   /api/auth/login',
        refresh:       'POST   /api/auth/refresh',
        logout:        'POST   /api/auth/logout',
        getProfile:    'GET    /api/auth/profile',
        updateProfile: 'PUT    /api/auth/profile',
      },
      internal: {
        getUser:        'GET    /internal/users/:id',
        listUsers:      'GET    /internal/users',
        validateToken:  'POST   /internal/validate-token',
      },
    },
  });
});

module.exports = router;
