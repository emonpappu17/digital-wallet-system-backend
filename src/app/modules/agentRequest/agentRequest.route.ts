import { Router } from "express";
import { agentRequestController } from "./agentRequest.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { agentRequestZodSchema } from "./agentRequest.validation";
import { checkAuth } from "../../middlewares/chechAuth";
import { Role } from "../user/user.interface";

const router = Router();

router.post(
    "/",
    validateRequest(agentRequestZodSchema),
    agentRequestController.createAgentRequest
)

router.get("/",
    checkAuth(Role.ADMIN),
    agentRequestController.getAllAgentRequests
);

router.patch(
    "/:id/approve",
    checkAuth(Role.ADMIN),
    agentRequestController.approveAgentRequest
)

router.patch(
    "/:id/suspend",
    checkAuth(Role.ADMIN),
    agentRequestController.suspendAgent
)



export const agentRequestRoutes = router;