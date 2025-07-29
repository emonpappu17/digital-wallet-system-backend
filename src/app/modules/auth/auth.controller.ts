import { NextFunction, Request, Response } from "express"
import { AuthService } from "./auth.service"
import { success } from "zod";
import { catchAsync } from "../../utils/catchAsync";
import { setAuthCookie } from "../../utils/setCookie";

// const login = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const loginInfo = await AuthService.login(req.body);

//         res.cookie("accessToken", loginInfo.accessToken, {
//             httpOnly: true,
//             secure: false
//         })

//         res.cookie("refreshToken", loginInfo.refreshToken, {
//             httpOnly: true,
//             secure: false
//         })

//         res.status(200).json({
//             success: true,
//             message: "Login successful",
//             data: loginInfo
//         })

//     } catch (error) {
//         next(error)
//     }
// }

const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const loginInfo = await AuthService.login(req.body);

    // res.cookie("accessToken", loginInfo.accessToken, {
    //     httpOnly: true,
    //     secure: false
    // })

    // res.cookie("refreshToken", loginInfo.refreshToken, {
    //     httpOnly: true,
    //     secure: false
    // })

    setAuthCookie(res, loginInfo)

    res.status(200).json({
        success: true,
        message: "Login successful",
        data: loginInfo
    })
})

export const authController = {
    login
}