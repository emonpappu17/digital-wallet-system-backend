import { NextFunction, Request, Response } from "express"
import { success } from "zod";
import { UserService } from "./user.service";
import { catchAsync } from "../../utils/catchAsync";

// const createUser = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const payload = req.body

//         const user = await UserService.createUser(payload)

//         console.log(user);

//         res.status(200).json({
//             success: true,
//             message: "User created successfully",
//             data: user
//         })
//     } catch (error) {
//         next(error)
//     }
// }

const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const payload = req.body

    const user = await UserService.createUser(payload)

    console.log(user);

    res.status(200).json({
        success: true,
        message: "User created successfully",
        data: user
    })

})

const myProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const id = req.user.userId

    const user = await UserService.myProfile(id)

    res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        data: user
    })

})

export const UserController = {
    createUser,
    myProfile
}