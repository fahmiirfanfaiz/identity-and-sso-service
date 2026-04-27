/**
 * Route Aggregator
 * Mounts all route modules.
 */
'use strict';

const { Router } = require('express');
const authRoutes = require('./auth');

const router = Router();

// ─── Mount routes ────────────────────────────
router.use('/auth', authRoutes);

// ─── Default route ───────────────────────────
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to auth-service API',
    version: '1.0.0',
  });
});

module.exports = router;
