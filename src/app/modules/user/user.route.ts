import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { registerUserZodSchema, updateUserZodSchema } from "./user.validation";
import { checkAuth } from "../../middlewares/chechAuth";
import { Role } from "./user.interface";

const router = Router();

router.post(
    "/register",
    validateRequest(registerUserZodSchema),
    UserController.createUser
)

router.patch(
    "/update",
    // validateRequest(updateUserZodSchema),
    checkAuth(...Object.values(Role)),
    UserController.updateUser
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

router.post(
    "/get-user",
    checkAuth(...Object.values(Role)),
    UserController.getUser
)

router.get(
    "/user-stats",
    checkAuth(Role.USER),
    UserController.getUserStats
)


export const userRoutes = router;