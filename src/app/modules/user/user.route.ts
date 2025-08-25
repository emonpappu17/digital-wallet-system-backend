import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { registerUserZodSchema } from "./user.validation";
import { checkAuth } from "../../middlewares/chechAuth";
import { Role } from "./user.interface";

const router = Router();

router.post(
    "/register",
    validateRequest(registerUserZodSchema),
    UserController.createUser
)


router.patch(
    "/:id/block",
    checkAuth(Role.ADMIN),
    UserController.blockUser
)

router.patch(
    "/:id/unblock",
    checkAuth(Role.ADMIN),
    UserController.unblockUser
)

router.get(
    "/me",
    checkAuth(...Object.values(Role)),
    UserController.myProfile
)


export const userRoutes = router;