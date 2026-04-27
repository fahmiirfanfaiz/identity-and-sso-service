/**
 * Error Handling Middleware
 * Provides consistent error responses across the service.
 */

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global Error Handler
 * Catches all errors and returns a consistent JSON response.
 */
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(err.errors && { errors: err.errors }),
  });
};

module.exports = { notFoundHandler, errorHandler };
