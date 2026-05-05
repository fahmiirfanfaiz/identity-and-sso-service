import type { NextFunction, Request, Response } from "express";

import { prisma } from "../lib/prisma";
import type { AppRole, SafeUser } from "../types/auth";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { verifyGoogleIdToken } from "../utils/googleOAuth";
import { config } from "../config";

const parseExpiresToMs = (expiresIn: string) => {
  const unit = expiresIn.slice(-1);
  const value = Number.parseInt(expiresIn.slice(0, -1), 10);
  const map: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (map[unit] ?? 1000);
};

const stripPassword = (user: {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const resolveOAuthRole = (email: string): AppRole => {
  // Temporary mapping while the dedicated role-authz branch is still using the old enum.
  return email.endsWith("@mail.ugm.ac.id") ? "client" : "freelancer";
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body as { idToken?: string };

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google idToken is required",
      });
    }

    const googleUser = await verifyGoogleIdToken(idToken);

    if (!googleUser.emailVerified) {
      return res.status(401).json({
        success: false,
        message: "Google account email is not verified",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    let user;

    if (!existingUser) {
      user = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          role: resolveOAuthRole(googleUser.email),
          googleSubject: googleUser.subject,
        },
      });
    } else if (existingUser.googleSubject && existingUser.googleSubject !== googleUser.subject) {
      return res.status(409).json({
        success: false,
        message: "Email is already linked to another Google account",
      });
    } else if (!existingUser.googleSubject) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          googleSubject: googleUser.subject,
          name: existingUser.name || googleUser.name,
        },
      });
    } else {
      user = existingUser;
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or account is inactive",
      });
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({ id: user.id });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + parseExpiresToMs(config.jwt.refreshExpiresIn)),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      data: {
        accessToken,
        refreshToken,
        user: stripPassword(user),
      },
    });
  } catch (error) {
    next(error);
  }
};
