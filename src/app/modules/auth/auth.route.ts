import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middlewares/validateRequest";

const router = Router()

router.post(
    "/login",
    authController.login
)

router.post(
    "/logout",
    authController.logout
)

export const authRoutes = router;