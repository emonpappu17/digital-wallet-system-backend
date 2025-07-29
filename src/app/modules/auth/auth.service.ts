import { Error } from "mongoose";
import { IUser, Role } from "../user/user.interface"
import { User } from "../user/user.model";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { envVars } from "../../config/env";

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

    const accessToken = jwt.sign(jwtPayload, envVars.JWT_ACCESS_SECRET, { expiresIn: "1d" })

    const refreshToken = jwt.sign(jwtPayload, envVars.JWT_REFRESH_SECRET, { expiresIn: "30d" })

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