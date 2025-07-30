import { Types } from "mongoose";

export enum TRANSACTION_TYPE {
    CASH_IN = "CASH_IN",
    CASH_OUT = "CASH_OUT"
}

export enum TRANSACTION_STATUS {
    COMPLETED = "COMPLETED",
    REVERSED = "REVERSED",
    PENDING = "PENDING"
}

export interface ITransaction {
    type: TRANSACTION_TYPE,
    amount: number,
    from: Types.ObjectId,
    to: Types.ObjectId,
    fee?: string,
    commission?: number,
    status?: TRANSACTION_STATUS
}