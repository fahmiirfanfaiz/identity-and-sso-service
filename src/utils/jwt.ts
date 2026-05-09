import jwt from "jsonwebtoken";

import { config } from "../config";
import type { JwtPayload, RefreshTokenPayload } from "../types/auth";

export const generateAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"],
  });

export const generateRefreshToken = (payload: RefreshTokenPayload) =>
  jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"],
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, config.jwt.secret) as JwtPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, config.jwt.secret) as RefreshTokenPayload;
