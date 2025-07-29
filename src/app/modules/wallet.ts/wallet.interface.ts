import { Types } from "mongoose"
import { Status } from "../user/user.interface"

export interface IWallet {
    user: Types.ObjectId,
    balance: number,
    status: Status
}