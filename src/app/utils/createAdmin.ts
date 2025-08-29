import { envVars } from "../config/env"
import { IUser, Role, Status } from "../modules/user/user.interface"
import { User } from "../modules/user/user.model"
import bcrypt from 'bcryptjs'


export const createAdmin = async () => {
    try {
        const isAdminExist = await User.findOne({ email: envVars.ADMIN_EMAIL })

        if (isAdminExist) {
            console.log("Admin already exist!");
            return
        }

        const hashedPassword = await bcrypt.hash(envVars.ADMIN_PASSWORD, Number(envVars.BCRYPT_SALT_ROUND));

        const payload: IUser = {
            name: "Jhankar Mahbub",
            password: hashedPassword,
            photo: "https://github.com/shadcn.png",
            // email: "jhankarmahbub@gmail.com",
            email: envVars.ADMIN_EMAIL,
            phoneNumber: envVars.ADMIN_PHONE,
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