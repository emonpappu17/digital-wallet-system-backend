import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { loginUserZodSchema } from "./auth.validation";

const router = Router()

router.post("/login", validateRequest(loginUserZodSchema), authController.login)

export const authRoutes = router;