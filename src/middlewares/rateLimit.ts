import type { NextFunction, Request, Response } from "express";

import { redisClient } from "../config/redis";

// Atomically increment and set expiry in one Redis round-trip.
// Prevents a race where INCR succeeds but PEXPIRE never runs,
// leaving the key with no TTL and permanently rate-limiting the client.
const INCR_WITH_EXPIRY = `
  local current = redis.call('INCR', KEYS[1])
  if current == 1 then
    redis.call('PEXPIRE', KEYS[1], ARGV[1])
  end
  return current
`;

export const createRateLimiter =
  (options: { windowMs: number; max: number; keyPrefix: string }) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (process.env.NODE_ENV === "test") {
      return next();
    }

    const ip = req.ip ?? "unknown";
    const key = `ratelimit:${options.keyPrefix}:${ip}`;

    try {
      const current = (await redisClient.eval(
        INCR_WITH_EXPIRY,
        1,
        key,
        String(options.windowMs),
      )) as number;

      if (current > options.max) {
        const ttl = await redisClient.pttl(key);
        res.status(429).json({
          success: false,
          message: "Too many requests, please try again later",
          retryAfter: Math.ceil(ttl / 1000),
        });
        return;
      }
    } catch {
      // Redis unavailable: fail-open, let the request through
      console.error(
        `[rateLimit] Redis unavailable for key ${options.keyPrefix}, skipping`,
      );
    }

    next();
  };
