import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { registerUserZodSchema } from "./user.validation";

const router = Router();

router.post("/register", validateRequest(registerUserZodSchema), UserController.createUser)

export const userRoutes = router;