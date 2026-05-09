import { Router } from "express";
import { body } from "express-validator";

import { authController } from "../controllers/auth.controller";
import authenticate from "../middlewares/authenticate";
import authorize from "../middlewares/authorize";
import { validate } from "../middlewares/validate";

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

// Public
router.post("/register", registerValidation, validate, authController.register);
router.post("/login", loginValidation, validate, authController.login);
router.post("/refresh", authController.refreshToken);

// Protected
router.post(
  "/logout",
  authenticate,
  authorize(["mahasiswa", "mitra", "admin"]),
  authController.logout,
);
router.get(
  "/profile",
  authenticate,
  authorize(["mahasiswa", "mitra", "admin"]),
  authController.getProfile,
);
router.put(
  "/profile",
  authenticate,
  authorize(["mahasiswa", "mitra", "admin"]),
  updateProfileValidation,
  validate,
  authController.updateProfile,
);

// Admin-only
router.post(
  "/register/admin",
  authenticate,
  authorize(["admin"]),
  registerValidation,
  validate,
  authController.register,
);

export default router;
