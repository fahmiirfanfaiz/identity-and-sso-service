import { config } from "../config";
import { refreshTokenRepository } from "../repositories/refreshToken.repository";
import { userRepository } from "../repositories/user.repository";
import type { AppRole, SafeUser } from "../types/auth";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../types/errors";
import { verifyGoogleIdToken } from "../utils/googleOAuth";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { parseExpiresToMs } from "../utils/time";
import { stripPassword } from "../utils/user";

const resolveOAuthRole = (_email: string): AppRole => "client";

export const googleAuthService = {
  async login(idToken: string | undefined): Promise<{
    accessToken: string;
    refreshToken: string;
    user: SafeUser;
  }> {
    if (!idToken) {
      throw new BadRequestError("Google idToken is required");
    }

    const googleUser = await verifyGoogleIdToken(idToken);

    if (!googleUser.emailVerified) {
      throw new UnauthorizedError("Google account email is not verified");
    }

    const existing = await userRepository.findByEmail(googleUser.email);
    let user;

    if (!existing) {
      user = await userRepository.create({
        name: googleUser.name,
        email: googleUser.email,
        role: resolveOAuthRole(googleUser.email),
        googleSubject: googleUser.subject,
      });
    } else if (existing.googleSubject && existing.googleSubject !== googleUser.subject) {
      throw new ConflictError("Email is already linked to another Google account");
    } else if (!existing.googleSubject) {
      user = await userRepository.update(existing.id, {
        googleSubject: googleUser.subject,
        name: existing.name || googleUser.name,
      });
    } else {
      user = existing;
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Invalid credentials or account is inactive");
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({ id: user.id });

    await refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + parseExpiresToMs(config.jwt.refreshExpiresIn)),
    });

    return { accessToken, refreshToken, user: stripPassword(user) };
  },
};
