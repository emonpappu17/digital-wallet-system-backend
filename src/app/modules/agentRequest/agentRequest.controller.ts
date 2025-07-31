import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { agentRequestService } from "./agentRequest.service";

const createAgentRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const result = await agentRequestService.createAgentRequest(req.body);
    res.status(200).json({
        success: true,
        message: "Request created successful wait for Admin approval",
        data: result
    })
})

const getAllAgentRequests = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const result = await agentRequestService.getAllAgentRequests();
    res.status(200).json({
        success: true,
        message: "All Agent request retrieved successfully",
        data: result
    })
})

const approveAgentRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const { id } = req.params;

    const result = await agentRequestService.approveAgentRequest(id)

    res.status(200).json({
        success: true,
        message: "Agent Created Successfully",
        data: result
    })
})

const suspendAgent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const { id } = req.params;

    const result = await agentRequestService.approveAgentRequest(id)

    res.status(200).json({
        success: true,
        message: "Agent Created Successfully",
        data: result
    })
})

export const agentRequestController = {
    createAgentRequest,
    approveAgentRequest,
    getAllAgentRequests,
    suspendAgent
}