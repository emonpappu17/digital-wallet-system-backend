import { envVars } from "../config/env"
import { IUser, Role, Status } from "../modules/user/user.interface"
import { User } from "../modules/user/user.model"
import bcrypt from 'bcryptjs'


export const createAdmin = async () => {
    try {
        const isAdminExist = await User.findOne({ phoneNumber: envVars.ADMIN_PHONE_NUMBER })

        if (isAdminExist) {
            console.log("Admin already exist!");
            return
        }

        const hashedPassword = await bcrypt.hash(envVars.ADMIN_PASSWORD, Number(envVars.BCRYPT_SALT_ROUND));

        const payload: IUser = {
            name: "Admin Man",
            password: hashedPassword,
            phoneNumber: envVars.ADMIN_PHONE_NUMBER,
            role: Role.ADMIN,
            status: Status.ACTIVE
        }

        const admin = await User.create(payload);

        console.log("Admin created successfully! \n");
        console.log("Admin--->", admin);
    } catch (error) {
        console.log(error);
    }
}