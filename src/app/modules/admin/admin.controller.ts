import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { adminService } from "./admin.service";

const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await adminService.getAllUsers();
    res.status(200).json({
        success: true,
        message: "All users retrieved successfully",
        data: result
    })
})


const getAllAgents = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const result = await adminService.getAllAgents();
    res.status(200).json({
        success: true,
        message: "All Agents retrieved successfully",
        data: result
    })
})

const getAllWallets = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const result = await adminService.getAllWallets();
    res.status(200).json({
        success: true,
        message: "All Wallets retrieved successfully",
        data: result
    })
})

const getAllTransactions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const result = await adminService.getAllTransactions();
    res.status(200).json({
        success: true,
        message: "All Transactions retrieved successfully",
        data: result
    })
})

export const adminController = {
    getAllUsers,
    getAllAgents,
    getAllWallets,
    getAllTransactions
}