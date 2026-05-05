import { Router } from "express";
import { body } from "express-validator";

import { googleLogin } from "../controllers/googleAuthController";

const router = Router();

router.post(
  "/google",
  body("idToken").trim().notEmpty().withMessage("Google idToken is required"),
  googleLogin
);

export default router;
