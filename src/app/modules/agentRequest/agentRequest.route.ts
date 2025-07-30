import { Router } from "express";
import { agentRequestController } from "./agentRequest.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { agentRequestZodSchema } from "./agentRequest.validation";

const router = Router();

router.post(
    "/",
    validateRequest(agentRequestZodSchema), agentRequestController.createAgentRequest
)
router.patch(
    "/approve/:id",
    agentRequestController.approveAgentRequest
)

export const agentRequestRoutes = router;