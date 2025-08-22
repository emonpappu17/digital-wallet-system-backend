import { NextFunction, Request, Response } from "express"
import { success } from "zod";
import { UserService } from "./user.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes"


const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const payload = req.body

    const user = await UserService.createUser(payload)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User created successfully",
        data: user
    })

})

const myProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const id = req.user.userId

    const user = await UserService.myProfile(id)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Profile retrieved successfully",
        data: user
    })

})

export const UserController = {
    createUser,
    myProfile
}