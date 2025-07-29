import { model, Schema } from "mongoose";
import { IWallet } from "./wallet.interface";
import { Role, Status } from "../user/user.interface";

const walletSchema = new Schema<IWallet>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        balance: {
            type: Number,
            required: true,
            default: 50,
            min: [0, "Balance cannot be negative"]
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

export const Wallet = model<IWallet>("Wallet", walletSchema)