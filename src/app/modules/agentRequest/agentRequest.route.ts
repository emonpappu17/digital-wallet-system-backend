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
    "/approve/:id",
    checkAuth(Role.ADMIN),
    agentRequestController.approveAgentRequest
)

router.patch(
    "/suspend/:id",
    checkAuth(Role.ADMIN),
    agentRequestController.suspendAgent
)

// router.get(
//     "/all-agents",
//     checkAuth(Role.ADMIN),
// )

export const agentRequestRoutes = router;