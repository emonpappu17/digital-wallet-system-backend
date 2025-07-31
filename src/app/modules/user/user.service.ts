import { envVars } from "../../config/env";
import { AgentRequestStatus } from "../agentRequest/agentRequest.interface";
import { Wallet } from "../wallet.ts/wallet.model";
import { IUser } from "./user.interface"
import { User } from "./user.model";
import bcryptjs from 'bcryptjs';

const createUser = async (payload: IUser) => {
    const { phoneNumber, password, ...rest } = payload;

    const isUserExist = await User.findOne({ phoneNumber })

    if (isUserExist) throw new Error("Phone number already exists")

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

    if (user?.status === AgentRequestStatus.SUSPEND as string) throw new Error("You are suspended contract with admin")

    if (!user) throw new Error("Profile not found")

    return user;
}

export const UserService = {
    createUser,
    myProfile
}