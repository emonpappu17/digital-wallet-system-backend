import { envVars } from "../../config/env";
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

    return user;
}

export const UserService = {
    createUser
}