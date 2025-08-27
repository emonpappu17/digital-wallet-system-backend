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


router.post(
    "/get-agent",
    checkAuth(...Object.values(Role)),
    agentRequestController.getAgent
)

router.get(
    "/agent-stats",
    checkAuth(Role.AGENT),
    agentRequestController.getAgentStats
)


export const agentRequestRoutes = router;