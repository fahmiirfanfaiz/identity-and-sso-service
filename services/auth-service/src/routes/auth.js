/**
 * Auth Routes
 * Defines all /api/auth/* endpoints.
 */
'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
} = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');

const router = Router();

// ─── Validation rules ───────────────────────

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

// ─── Routes ─────────────────────────────────

// POST /api/auth/register
router.post('/register', registerValidation, register);

// POST /api/auth/login
router.post('/login', loginValidation, login);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

// POST /api/auth/logout (requires authentication)
router.post('/logout', authenticate, logout);

// GET /api/auth/profile (requires authentication)
router.get('/profile', authenticate, getProfile);

// PUT /api/auth/profile (requires authentication)
router.put('/profile', authenticate, updateProfileValidation, updateProfile);

module.exports = router;
