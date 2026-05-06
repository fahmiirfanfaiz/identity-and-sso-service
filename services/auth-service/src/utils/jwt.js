/**
 * JWT Utility
 * Generates and verifies access/refresh tokens.
 */
'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate a short-lived access token.
 * @param {object} payload - Data to encode (e.g. { id, email, role })
 * @returns {string} signed JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};

/**
 * Generate a long-lived refresh token.
 * @param {object} payload - Data to encode (e.g. { id })
 * @returns {string} signed JWT
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

/**
 * Verify and decode an access token.
 * @param {string} token
 * @returns {object} decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

/**
 * Verify and decode a refresh token.
 * @param {string} token
 * @returns {object} decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
