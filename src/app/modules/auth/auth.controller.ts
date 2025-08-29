import { NextFunction, Request, Response } from "express"
import { AuthService } from "./auth.service"
import { success } from "zod";
import { catchAsync } from "../../utils/catchAsync";
import { setAuthCookie } from "../../utils/setCookie";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes"
import AppError from "../../errorHelpers/AppError";


const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const loginInfo = await AuthService.login(req.body);

    setAuthCookie(res, loginInfo)

    res.status(200).json({
        success: true,
        message: "Login successful",
        data: loginInfo
    })
})

const getNewAccessToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) throw new AppError(httpStatus.BAD_REQUEST, "No refresh token received from cookies");

    const tokenInfo = await AuthService.getNewAccessToken(refreshToken as string)

    setAuthCookie(res, tokenInfo);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "New Access Token Retrieved Successfully",
        data: tokenInfo
    })
})

const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: true,
        // secure: false,
        sameSite: "none"
        // sameSite: "lax"
    })

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        // secure: false,
        sameSite: "none"
        // sameSite: "lax"
    })

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged Out Successfully",
        data: null
    })
})

export const authController = {
    login,
    logout,
    getNewAccessToken
}