import bcrypt from 'bcrypt';
import { Error } from "mongoose";
import { envVars } from "../../config/env";
import { generateToken } from "../../utils/jwt";
import { IUser } from "../user/user.interface";
import { User } from "../user/user.model";

const login = async (payload: Partial<IUser>) => {
    const { phoneNumber, password } = payload;

    const user = await User.findOne({ phoneNumber })

    if (!user) throw new Error("This Number is not exists")

    const isPasswordMatched = await bcrypt.compare(password as string, user.password)

    if (!isPasswordMatched) throw new Error("Password did not match")

    const jwtPayload = {
        userId: user._id,
        phoneNumber: user.phoneNumber,
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

export const AuthService = {
    login
}