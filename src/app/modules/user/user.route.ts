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

// router.get(
//     "/all-users",
//     checkAuth(Role.ADMIN)
// )

// router.get(
//     "/me",
//     checkAuth(...Object.values(Role)),
// )


export const userRoutes = router;