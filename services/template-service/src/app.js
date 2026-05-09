/**
 * Express Application Setup
 * Configures middleware, routes, and error handling.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

// ─── Security & Parsing Middleware ───────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ─────────────────────────────────
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Health Check ────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'template-service', // ← Ganti nama service di sini
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ──────────────────────────────
app.use('/api', routes);

// ─── [MOCK] Internal Routes (service-to-service) ──
// TODO: Hapus ini saat auth-service dari Nabil sudah live
const mockInternalRoutes = require('./routes/mock/internal');
app.use('/internal', mockInternalRoutes);

// ─── Error Handling ──────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
