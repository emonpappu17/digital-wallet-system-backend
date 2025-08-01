import { model, Schema } from "mongoose";
import { ITransaction, TRANSACTION_STATUS, TRANSACTION_TYPE } from "./transaction.interface";

const transactionSchema = new Schema<ITransaction>({
    from: {
        type: Schema.Types.Mixed,
        required: true,
    },
    to: {
        type: Schema.Types.Mixed,
        required: true,
    },
    type: {
        type: String,
        enum: {
            values: Object.values(TRANSACTION_TYPE),
            message: "Invalid transaction type",
        },
        required: [true, "Transaction type is required"],
    },
    amount: {
        type: Number,
        required: [true, "Transaction amount is required"],
        min: [0, "Amount must be a positive number"]
    },
    fee: {
        type: Number,
        default: 0,
        min: [0, "Fee cannot be negative"]
    },
    agentCommission: {
        type: Number,
        default: 0,
        min: [0, "Commission cannot be negative"],
    },
    status: {
        type: String,
        enum: {
            values: Object.values(TRANSACTION_STATUS),
            message: "Invalid transaction status"
        },
        default: TRANSACTION_STATUS.COMPLETED
    },
}, {
    timestamps: true,
    versionKey: false
})

export const Transaction = model<ITransaction>("Transaction", transactionSchema)