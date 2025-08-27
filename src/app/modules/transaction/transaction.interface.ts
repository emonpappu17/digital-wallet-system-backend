import { Types } from "mongoose";

// export enum TRANSACTION_TYPE {
//     CASH_IN = "CASH_IN",
//     CASH_OUT = "CASH_OUT"
// }

export enum TRANSACTION_TYPE {
    CASH_IN = "CASH_IN",
    CASH_OUT = "CASH_OUT",
    ADD_MONEY = "ADD_MONEY",
    WITHDRAW = "WITHDRAW",
    SEND_MONEY = "SEND_MONEY",
};


export enum TRANSACTION_STATUS {
    COMPLETED = "COMPLETED",
    REVERSED = "REVERSED",
    PENDING = "PENDING"
}

export interface ITransaction {
    type: TRANSACTION_TYPE,
    amount: number,
    from: Types.ObjectId | string,
    to: Types.ObjectId | string,
    fee?: string,
    agentCommission?: number,
    status?: TRANSACTION_STATUS,
    transactionId?: string
}