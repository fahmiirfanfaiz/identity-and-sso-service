import type { AuditAction, AuditLog } from "@prisma/client";

import { auditLogRepository } from "../repositories/auditLog.repository";
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

  async validateToken(token: string | undefined): Promise<JwtPayload> {
    if (!token) {
      throw new BadRequestError("Token is required");
    }

    let payload: JwtPayload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }

    const user = await userRepository.findById(payload.id);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("User not found or inactive");
    }

    return payload;
  },

  async listAuditLogs(params?: {
    userId?: string;
    action?: AuditAction;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const logs = await auditLogRepository.findMany(params);
    return { logs, total: logs.length };
  },
};
