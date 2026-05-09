import { Router } from "express";
import { body } from "express-validator";

import { googleAuthController } from "../controllers/googleAuth.controller";
import { validate } from "../middlewares/validate";

const router = Router();

router.post(
  "/google",
  body("idToken").trim().notEmpty().withMessage("Google idToken is required"),
  validate,
  googleAuthController.login,
);

export default router;
