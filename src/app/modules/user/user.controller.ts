import { NextFunction, Request, Response } from "express"
import { success } from "zod";
import { UserService } from "./user.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes"
import { JwtPayload } from "jsonwebtoken";


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

const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const decodedToken = req.user;

    const user = await UserService.updateUser(req.body, decodedToken as JwtPayload);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "User Updated Successfully",
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

const unblockUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const { id } = req.params;

    const result = await UserService.unblockUser(id)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User unblocked Successfully",
        data: result
    })
})

const blockUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const { id } = req.params;

    const result = await UserService.blockUser(id)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User blocked Successfully",
        data: result
    })
})

const getUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const userInfo = await UserService.getUser(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User get Successfully",
        data: userInfo
    })
})

const getUserStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user.userId
    const query = req.query;


    const userStats = await UserService.getUserStats(id, query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User stats get Successfully",
        data: {
            user: userStats.user,
            wallet: userStats.wallet,
            transaction: userStats.transactions
        },
        meta: userStats.meta
    })
})


export const UserController = {
    createUser,
    myProfile,
    blockUser,
    unblockUser,
    getUser,
    getUserStats,
    updateUser
}