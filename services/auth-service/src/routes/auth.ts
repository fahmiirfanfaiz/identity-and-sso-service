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

const router = Router();

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role")
    .optional()
    .isIn(["client", "freelancer", "admin"])
    .withMessage("Role must be client, freelancer, or admin"),
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

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/refresh", refreshToken);
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfileValidation, updateProfile);

export default router;
