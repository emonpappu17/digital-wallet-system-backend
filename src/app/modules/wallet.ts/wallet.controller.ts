import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { walletService } from "./wallet.service";

const fundAgentWallet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const result = await walletService.fundAgentWallet(req.body);
    res.status(200).json({
        success: true,
        message: "Agent wallet funded successfully",
        data: result
    })
})

export const walletController = {
    fundAgentWallet
}
