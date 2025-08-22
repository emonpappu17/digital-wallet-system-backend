import { model, Schema } from "mongoose";
import { IUser, Role, Status } from "./user.interface";
import { number } from "zod";

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Name is required"]
        },
        phoneNumber: {
            type: String,
            required: [true, "Phone Number is required"],
            unique: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true
        },
        password: {
            type: String,
        },
        role: {
            type: String,
            enum: Object.values(Role),
            default: Role.USER
        },
        status: {
            type: String,
            enum: Object.values(Status),
            default: Status.ACTIVE
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
)

export const User = model<IUser>("User", userSchema)