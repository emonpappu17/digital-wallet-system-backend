import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { transactionService } from "./transaction.service";

const addMoney = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.userId;
    const result = await transactionService.addMoney(userId, req.body.amount);
    res.status(200).json({
        success: true,
        message: "Add money successfully",
        data: result
    })
})

const withdrawMoney = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.userId;
    const result = await transactionService.withdrawMoney(userId, req.body.amount);
    res.status(200).json({
        success: true,
        message: "Withdraw money successfully",
        data: result
    })
})

const sendMoney = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const senderId = req.user.userId;
    const result = await transactionService.sendMoney(senderId, req.body);
    res.status(200).json({
        success: true,
        message: "Send money successfully",
        data: result
    })
})

const cashIn = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const agentId = req.user.userId;
    const result = await transactionService.cashIn(agentId, req.body);
    res.status(200).json({
        success: true,
        message: "Cash In successfully",
        data: result
    })
})

const cashOut = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.userId;
    const result = await transactionService.cashOut(userId, req.body);
    res.status(200).json({
        success: true,
        message: "Cash Out successfully",
        data: result
    })
})

const getMyTransactionHistory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user.userId;
    const result = await transactionService.getMyTransactionHistory(id);
    res.status(200).json({
        success: true,
        message: "Transaction history retrieved successfully",
        data: result
    })
})

const getAgentCommission = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user.userId;
    const result = await transactionService.getAgentCommission(id);
    res.status(200).json({
        success: true,
        message: "Agent commissions retrieved successfully",
        data: result
    })
})

export const transactionController = {
    addMoney,
    withdrawMoney,
    sendMoney,
    cashIn,
    cashOut,
    getMyTransactionHistory,
    getAgentCommission
}