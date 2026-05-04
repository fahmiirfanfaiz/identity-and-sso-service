import type { NextFunction, Request, Response } from "express";

type ErrorWithStatusCode = Error & {
  statusCode?: number;
  errors?: unknown;
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const error: ErrorWithStatusCode = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (
  err: ErrorWithStatusCode,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV === "development") {
    console.error("Error:", {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
    ...(err.errors ? { errors: err.errors } : {}),
  });
};
