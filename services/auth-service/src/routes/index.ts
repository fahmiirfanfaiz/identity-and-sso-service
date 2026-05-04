import { Router } from "express";

import authRoutes from "./auth";

const router = Router();

router.use("/auth", authRoutes);

router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Welcome to auth-service API",
    version: "1.0.0",
  });
});

export default router;
