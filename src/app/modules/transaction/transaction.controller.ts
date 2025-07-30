import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { transactionService } from "./transaction.service";

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

export const transactionController = {
    cashIn,
    cashOut
}