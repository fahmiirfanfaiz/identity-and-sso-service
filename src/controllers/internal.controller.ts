import type { NextFunction, Request, Response } from "express";

import { internalService } from "../services/internal.service";

export const internalController = {
  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await internalService.getUser(String(req.params.id));
      return res.status(200).json({
        success: true,
        message: "User found",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  async listUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await internalService.listUsers();
      return res.status(200).json({
        success: true,
        message: "Users retrieved",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async validateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = await internalService.validateToken(req.body?.token);
      return res.status(200).json({
        success: true,
        message: "Token is valid",
        data: { user: payload },
      });
    } catch (error) {
      next(error);
    }
  },
};
