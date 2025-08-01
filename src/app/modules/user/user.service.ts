import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { AgentRequestStatus } from "../agentRequest/agentRequest.interface";
import { Wallet } from "../wallet.ts/wallet.model";
import { IUser } from "./user.interface"
import { User } from "./user.model";
import bcryptjs from 'bcryptjs';
import httpStatus from "http-status-codes"

const createUser = async (payload: IUser) => {
    const { phoneNumber, password, ...rest } = payload;

    const isUserExist = await User.findOne({ phoneNumber })

    if (isUserExist) throw new AppError(httpStatus.BAD_REQUEST, "Phone number already exists")

    const hashedPassword = await bcryptjs.hash(password, Number(envVars.BCRYPT_SALT_ROUND))

    const user = await User.create({
        phoneNumber,
        password: hashedPassword,
        ...rest
    })

    await Wallet.create({ user: user._id, balance: 50 });

    return user;
}

const myProfile = async (id: string) => {

    const user = await User.findById(id);

    if (user?.status === AgentRequestStatus.SUSPEND as string) throw new AppError(httpStatus.FORBIDDEN, "You are suspended contract with admin")

    if (!user) throw new AppError(httpStatus.NOT_FOUND, "Profile not found")

    return user;
}

export const UserService = {
    createUser,
    myProfile
}