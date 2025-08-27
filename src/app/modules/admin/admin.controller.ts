import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { adminService } from "./admin.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes"

const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;

    const result = await adminService.getAllUsers(query as Record<string, string>);

    // sendResponse(res, {
    //     success: true,
    //     statusCode: httpStatus.OK,
    //     message: "All users retrieved successfully",
    //     data: result
    // })

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All Users retrieved successfully",
        data: {
            users: result.users,
            statistics: result.statistics
        },
        meta: result.pagination
    })
})


const getAllAgents = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await adminService.getAllAgents(query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All Agents retrieved successfully",
        data: {
            agents: result.agents,
            statistics: result.statistics
        },
        meta: result.pagination
    })
})

const getAllWallets = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const result = await adminService.getAllWallets();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All Wallets retrieved successfully",
        data: result
    })
})

const getAllTransactions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const result = await adminService.getAllTransactions();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All Transactions retrieved successfully",
        data: result
    })
})

const getAllUserStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const query = req.query;
    const result = await adminService.getAllUserStats(query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All users stats retrieved successfully",
        data: {
            // agents: result.agents,
            // users: result.users,
            totals: result.totals,
            transactions: result.transactions,
            charts: result.charts
        },
        meta: result.meta
    })
})

export const adminController = {
    getAllUsers,
    getAllAgents,
    getAllWallets,
    getAllTransactions,
    getAllUserStats
}