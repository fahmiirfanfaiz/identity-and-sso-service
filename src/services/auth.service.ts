import bcrypt from "bcryptjs";

import { config } from "../config";
import { refreshTokenRepository } from "../repositories/refreshToken.repository";
import { userRepository } from "../repositories/user.repository";
import type { AppRole, SafeUser } from "../types/auth";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "../types/errors";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { parseExpiresToMs } from "../utils/time";
import { stripPassword } from "../utils/user";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role?: AppRole;
};

type LoginInput = {
  email: string;
  password: string;
};

type UpdateProfileInput = {
  name?: string;
  password?: string;
};

export const authService = {
  async register(input: RegisterInput): Promise<SafeUser> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: input.role ?? "mahasiswa",
    });

    return stripPassword(user);
  },

  async login(input: LoginInput): Promise<{
    accessToken: string;
    refreshToken: string;
    user: SafeUser;
  }> {
    const user = await userRepository.findByEmail(input.email);

    if (!user || !user.isActive || !user.password) {
      throw new UnauthorizedError("Invalid credentials or account is inactive");
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
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

  async refreshAccessToken(token: string | undefined): Promise<{ accessToken: string }> {
    if (!token) {
      throw new BadRequestError("Refresh token is required");
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const stored = await refreshTokenRepository.findByTokenAndUser(token, decoded.id);
    if (!stored || new Date() > stored.expiresAt) {
      throw new UnauthorizedError("Refresh token not found or expired");
    }

    const user = await userRepository.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("User not found or inactive");
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  },

  async logout(token: string | undefined): Promise<void> {
    if (!token) {
      throw new BadRequestError("Refresh token is required");
    }
    await refreshTokenRepository.deleteByToken(token);
  },

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return stripPassword(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<SafeUser> {
    const existing = await userRepository.findById(userId);
    if (!existing) {
      throw new NotFoundError("User not found");
    }

    const data: { name?: string; password?: string } = {};
    if (input.name) {
      data.name = input.name;
    }
    if (input.password) {
      data.password = await bcrypt.hash(input.password, 12);
    }

    const updated = await userRepository.update(userId, data);
    return stripPassword(updated);
  },
};
