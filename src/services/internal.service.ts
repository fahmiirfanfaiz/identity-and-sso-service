import { userRepository } from "../repositories/user.repository";
import type { JwtPayload, SafeUser } from "../types/auth";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../types/errors";
import { verifyAccessToken } from "../utils/jwt";
import { stripPassword } from "../utils/user";

export const internalService = {
  async getUser(id: string): Promise<SafeUser> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return stripPassword(user);
  },

  async listUsers(): Promise<{ users: SafeUser[]; total: number }> {
    const users = await userRepository.findMany();
    const safe = users.map(stripPassword);
    return { users: safe, total: safe.length };
  },

  validateToken(token: string | undefined): JwtPayload {
    if (!token) {
      throw new BadRequestError("Token is required");
    }
    try {
      return verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }
  },
};
