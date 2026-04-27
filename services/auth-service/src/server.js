/**
 * Server Entry Point
 * Connects to database and starts the Express server.
 */
const app = require('./app');
const config = require('./config');
const { sequelize } = require('./models');

const PORT = config.port;

// ─── Start Server ────────────────────────────
async function start() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync models in development (optional, migrations preferred)
    if (config.nodeEnv === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Models synchronized.');
    }

    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`🚀 auth-service running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
    });

    // ─── Graceful Shutdown ─────────────────────
    const shutdown = async (signal) => {
      console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log('🔌 HTTP server closed.');

        try {
          await sequelize.close();
          console.log('🗄️  Database connection closed.');
        } catch (err) {
          console.error('❌ Error closing database:', err);
        }

        process.exit(0);
      });

      // Force close after 10s
      setTimeout(() => {
        console.error('⚠️  Forcing shutdown...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

start();
