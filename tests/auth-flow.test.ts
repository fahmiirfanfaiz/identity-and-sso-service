import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { prisma as prismaClient } from "../src/models/prisma";

type PrismaClient = typeof prismaClient;

const uniqueId = Date.now();
const testUser = {
  name: "MVP Test User",
  email: `mvp.test.${uniqueId}@example.com`,
  password: "Password123!",
  updatedName: "MVP Test User Updated",
};

let app: Express;
let prisma: PrismaClient;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
  process.env.INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "test-internal-key";

  const appModule = await import("../src/app");
  const prismaModule = await import("../src/models/prisma");

  app = appModule.default;
  prisma = prismaModule.prisma;

  await prisma.$connect();
  await prisma.user.deleteMany({ where: { email: testUser.email } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});

describe("MVP auth flow", () => {
  it("returns health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      status: "ok",
      service: "identity-and-sso-service",
    });
  });

  it("registers, logs in, refreshes, reads profile, updates profile, validates token, and logs out", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
        role: "talent",
      });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.data.user).toMatchObject({
      name: testUser.name,
      email: testUser.email,
      role: "talent",
      isActive: true,
    });
    expect(registerResponse.body.data.user.password).toBeUndefined();

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.accessToken).toEqual(expect.any(String));
    expect(loginResponse.body.data.refreshToken).toEqual(expect.any(String));

    const { accessToken, refreshToken } = loginResponse.body.data;

    const profileResponse = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.data.user.email).toBe(testUser.email);

    const updateProfileResponse = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: testUser.updatedName });

    expect(updateProfileResponse.status).toBe(200);
    expect(updateProfileResponse.body.data.user.name).toBe(testUser.updatedName);

    const refreshResponse = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data.accessToken).toEqual(expect.any(String));

    const validateTokenResponse = await request(app)
      .post("/internal/validate-token")
      .set("x-internal-api-key", process.env.INTERNAL_API_KEY ?? "")
      .send({ token: refreshResponse.body.data.accessToken });

    expect(validateTokenResponse.status).toBe(200);
    expect(validateTokenResponse.body.data.user.email).toBe(testUser.email);

    const logoutResponse = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(logoutResponse.status).toBe(200);

    const refreshAfterLogoutResponse = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(refreshAfterLogoutResponse.status).toBe(401);
  });

  it("rejects duplicate email registration", async () => {
    const duplicateResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Duplicate User",
        email: testUser.email,
        password: testUser.password,
        role: "talent",
      });

    expect(duplicateResponse.status).toBe(409);
  });
});
