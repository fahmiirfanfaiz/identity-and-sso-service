import { Router } from "express";

import { internalController } from "../controllers/internal.controller";

const router = Router();

router.get("/users/:id", internalController.getUser);
router.get("/users", internalController.listUsers);
router.post("/validate-token", internalController.validateToken);

export default router;
