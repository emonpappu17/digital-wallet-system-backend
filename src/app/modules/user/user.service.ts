import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { AgentRequestStatus } from "../agentRequest/agentRequest.interface";
import { AgentRequest } from "../agentRequest/agentRequest.model";
import { Wallet } from "../wallet.ts/wallet.model";
import { IUser, Role } from "./user.interface"
import { User } from "./user.model";
import bcryptjs from 'bcryptjs';
import httpStatus from "http-status-codes"

const createUser = async (payload: IUser) => {
    const { phoneNumber, password, email, ...rest } = payload;

    console.log({ payload });

    const isUserExist = await User.findOne({
        $or: [{ phoneNumber }, { email }]
    })

    if (isUserExist) throw new AppError(httpStatus.BAD_REQUEST, "Account already exists");

    const isAgentExist = await AgentRequest.findOne({
        $or: [{ phoneNumber }, { email }]
    })

    if (isAgentExist) throw new AppError(httpStatus.BAD_REQUEST, "This credential is already using for Agent")

    const hashedPassword = await bcryptjs.hash(password, Number(envVars.BCRYPT_SALT_ROUND))

    const user = await User.create({
        phoneNumber,
        email,
        password: hashedPassword,
        ...rest
    })

    await Wallet.create({ user: user._id, balance: 50 });

    const { password: pass, ...userInfo } = user.toObject();

    return userInfo;
}

const myProfile = async (id: string) => {

    const user = await User.findById(id).select("-password");

    if (user?.status === AgentRequestStatus.SUSPEND as string) throw new AppError(httpStatus.FORBIDDEN, "You are suspended contract with admin");

    if (!user) throw new AppError(httpStatus.NOT_FOUND, "Profile not found")

    return user;
}

export const UserService = {
    createUser,
    myProfile
}