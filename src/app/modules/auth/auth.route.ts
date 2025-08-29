import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router()

router.post(
    "/login",
    authController.login
)
router.post(
    "/refresh-token",
    authController.getNewAccessToken
)

router.post(
    "/logout",
    authController.logout
)

export const authRoutes = router;