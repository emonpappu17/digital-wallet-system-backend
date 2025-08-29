import { JwtPayload } from "jsonwebtoken"
import { envVars } from "../config/env"
import { generateToken, verifyToken } from "./jwt"
import { User } from "../modules/user/user.model";
import AppError from "../errorHelpers/AppError";
import httpStatus from 'http-status-codes'
import { Status } from "../modules/user/user.interface";


export const createNewAccessTokenWithRefreshToken = async (refreshToken: string) => {
    const verifiedRefreshToken = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET) as JwtPayload;

    const isUserExist = await User.findOne({ email: verifiedRefreshToken.email });

    if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User doest not exist")
    }

    if (isUserExist.status === Status.BLOCKED) throw new AppError(httpStatus.FORBIDDEN, "User is blocked")

    if (isUserExist.status === Status.SUSPEND) throw new AppError(httpStatus.FORBIDDEN, "Agent is suspended")

    const jwtPayload = {
        userId: isUserExist._id,
        phoneNumber: isUserExist.phoneNumber,
        email: isUserExist.email,
        role: isUserExist.role
    }

    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES);

    return accessToken;
}