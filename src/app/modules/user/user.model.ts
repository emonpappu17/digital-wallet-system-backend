import { model, Schema } from "mongoose";
import { IUser, Role, Status } from "./user.interface";
import { string } from "zod";

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Name is required"]
        },
        email: {
            type: String, unique: true
        },
        phoneNumber: {
            type: String,
            required: [true, "Phone Number is required"],
            unique: true
        },
        pin: {
            type: String,
            required: [true, "PIN is required"],
            min: 0
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
    }
)

export const User = model<IUser>("User", userSchema)