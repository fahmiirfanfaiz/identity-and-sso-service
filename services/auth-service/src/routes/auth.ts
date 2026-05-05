import { Router } from "express";
import { body } from "express-validator";

import {
  getProfile,
  login,
  logout,
  refreshToken,
  register,
  updateProfile,
} from "../controllers/authController";
import authenticate from "../middlewares/authenticate";
import authorize from "../middlewares/authorize";

const router = Router();

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role")
    .optional()
    .isIn(["mahasiswa", "mitra", "admin"])
    .withMessage("Role must be mahasiswa, mitra, or admin"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const updateProfileValidation = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

// ─── Public Endpoints ────────────────────────────
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/refresh", refreshToken);

// ─── Protected Endpoints (semua role yang sudah login) ─
router.post("/logout", authenticate, authorize(["mahasiswa", "mitra", "admin"]), logout);
router.get("/profile", authenticate, authorize(["mahasiswa", "mitra", "admin"]), getProfile);
router.put("/profile", authenticate, authorize(["mahasiswa", "mitra", "admin"]), updateProfile);

// ─── Admin-Only Endpoint ─────────────────────────
// Hanya admin yang boleh membuat akun admin baru
router.post("/register/admin", authenticate, authorize(["admin"]), registerValidation, register);

export default router;

