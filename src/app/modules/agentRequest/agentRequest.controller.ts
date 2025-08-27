import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { agentRequestService } from "./agentRequest.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes"


const createAgentRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const result = await agentRequestService.createAgentRequest(req.body);

    // res.status(200).json({
    //     success: true,
    //     message: "Request created successful wait for Admin approval",
    //     data: result
    // })

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Request created successful wait for Admin approval",
        data: result
    })
})

const getAllAgentRequests = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const result = await agentRequestService.getAllAgentRequests();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All Agent request retrieved successfully",
        data: result
    })
})

const approveAgentRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const { id } = req.params;

    const result = await agentRequestService.approveAgentRequest(id)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Agent approved Successfully",
        data: result
    })
})

const suspendAgent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const { id } = req.params;

    const result = await agentRequestService.suspendAgent(id)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Agent Suspended Successfully",
        data: result
    })
})
const getAgent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const agentInfo = await agentRequestService.getAgent(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "agent get Successfully",
        data: agentInfo
    })
})
const getAgentStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const id = req.user.userId
    const query = req.query;


    const agentStats = await agentRequestService.getAgentStats(id, query as Record<string, string>);

    // sendResponse(res, {
    //     success: true,
    //     statusCode: httpStatus.OK,
    //     message: "agent get Successfully",
    //     data: agentInfo
    // })

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Agent stats get Successfully",
        data: {
            agent: agentStats.agent,
            wallet: agentStats.wallet,
            transaction: agentStats.transactions,
            summary: agentStats.summary
        },
        meta: agentStats.meta
    })
})

export const agentRequestController = {
    createAgentRequest,
    approveAgentRequest,
    getAllAgentRequests,
    suspendAgent,
    getAgent,
    getAgentStats
}