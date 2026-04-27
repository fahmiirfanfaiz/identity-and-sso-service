/**
 * Auth Controller
 * Handles all authentication and profile management logic.
 */
'use strict';

const { validationResult } = require('express-validator');
const { User, RefreshToken } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const config = require('../config');

// ─── Helper: parse expires string to ms ──────
const parseExpiresToMs = (expiresIn) => {
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1), 10);
  const map = { s: 1000, m: 60 * 1000, h: 3600 * 1000, d: 24 * 3600 * 1000 };
  return value * (map[unit] || 1000);
};

// ─── Helper: format validation errors ────────
const formatValidationErrors = (errors) =>
  errors.array().map((e) => ({ field: e.path, message: e.msg }));

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(errors),
      });
    }

    const { name, email, password } = req.body;

    // Check duplicate email
    const existing = await User.unscoped().findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create user (password hashed via model hook)
    const user = await User.create({ name, email, password });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(errors),
      });
    }

    const { email, password } = req.body;

    // Find user WITH password field
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account is inactive',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account is inactive',
      });
    }

    // Generate tokens
    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user.id });

    // Persist refresh token
    const expiresAt = new Date(Date.now() + parseExpiresToMs(config.jwt.refreshExpiresIn));
    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt,
    });

    // Return user without password
    const safeUser = await User.findByPk(user.id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { accessToken, refreshToken, user: safeUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify JWT signature/expiry
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Check token exists in DB and not expired
    const storedToken = await RefreshToken.findOne({
      where: { token, user_id: decoded.id },
    });

    if (!storedToken || new Date() > new Date(storedToken.expires_at)) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found or expired',
      });
    }

    // Find user to get latest role
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Access token refreshed',
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    await RefreshToken.destroy({ where: { token } });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/profile  (requires authenticate middleware)
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/profile  (requires authenticate middleware)
 */
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(errors),
      });
    }

    const user = await User.scope('withPassword').findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { name, password } = req.body;

    if (name) user.name = name;
    if (password) user.password = password; // hook will hash it

    await user.save();

    const updatedUser = await User.findByPk(user.id);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refreshToken, logout, getProfile, updateProfile };
