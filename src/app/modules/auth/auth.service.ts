import bcrypt from 'bcrypt';
import httpStatus from "http-status-codes";
import { envVars } from "../../config/env";
import AppError from '../../errorHelpers/AppError';
import { generateToken } from "../../utils/jwt";
import { createNewAccessTokenWithRefreshToken } from '../../utils/userToken';
import { IUser, Status } from "../user/user.interface";
import { User } from "../user/user.model";

const login = async (payload: Partial<IUser>) => {
    const { phoneNumber, email, password } = payload;

    // console.log({ payload });

    // const user = await User.findOne({ phoneNumber })
    const user = await User.findOne({
        $or: [{ phoneNumber }, { email }]
    })

    if (!user || user.status === Status.PENDING) throw new AppError(httpStatus.NOT_FOUND, "This User is not exists")

    const isPasswordMatched = await bcrypt.compare(password as string, user.password)

    if (!isPasswordMatched) throw new AppError(httpStatus.BAD_REQUEST, "Password did not match");

    if (user?.status === Status.BLOCKED) throw new AppError(httpStatus.NOT_FOUND, "User is blocked")

    if (user.status === Status.SUSPEND) throw new AppError(httpStatus.NOT_FOUND, "Agent is suspended")

    const jwtPayload = {
        userId: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role
    }

    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

    const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES)

    const { password: pass, ...rest } = user.toObject();

    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: rest
    }
}

const getNewAccessToken = async (refreshToken: string) => {

    console.log(refreshToken);
    const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken)
    console.log({ newAccessToken });
    return {
        accessToken: newAccessToken
    }
}

export const AuthService = {
    login,
    getNewAccessToken
}