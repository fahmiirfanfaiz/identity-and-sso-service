/**
 * Route Aggregator
 * Mount all route modules here.
 *
 * Example:
 *   const authRoutes = require('./auth');
 *   router.use('/auth', authRoutes);
 */
const { Router } = require('express');

const router = Router();

// ─── Mount routes below ──────────────────────

// Example:
// const authRoutes = require('./auth');
// router.use('/auth', authRoutes);

// ─── Default route ───────────────────────────
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to template-service API', // ← Ganti nama service
    version: '1.0.0',
  });
});

module.exports = router;
