import mongoose, { MongooseError, Types } from "mongoose";
import { Role, Status } from "../user/user.interface";
import { User } from "../user/user.model"
import { Wallet } from "../wallet.ts/wallet.model";
import { ITransaction, TRANSACTION_STATUS, TRANSACTION_TYPE } from "./transaction.interface";
import { Transaction } from "./transaction.model";
import { AgentRequestStatus } from "../agentRequest/agentRequest.interface";
import httpStatus from "http-status-codes"
import AppError from "../../errorHelpers/AppError";
import { FEE_CONFIG } from "./transaction.contrant";
import { generateTransactionId } from "../../utils/generateTransactionId";

interface ICashIn {
    userPhoneNumber: string,
    amount: number
}
interface ICashOut {
    agentPhoneNumber: string,
    amount: number
}
interface ISendMoney {
    receiverPhoneNumber: string,
    amount: number
}


const addMoney = async (userId: string, amount: number) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const user = await User.findById(userId);

        if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found")

        const userWallet = await Wallet.findOne({ user: userId }).session(session);

        if (!userWallet) throw new AppError(httpStatus.NOT_FOUND, "User Wallet not found");

        if (userWallet.status === Status.BLOCKED as string) {
            throw new AppError(httpStatus.BAD_REQUEST, "User Wallet is blocked");
        }

        userWallet.balance += amount;
        await userWallet.save({ session });

        const transactionId = generateTransactionId();

        const transaction = await Transaction.create([
            {
                from: "external_bank/credit_card",
                to: user._id,
                type: TRANSACTION_TYPE.ADD_MONEY,
                amount,
                status: TRANSACTION_STATUS.COMPLETED,
                transactionId
            }
        ], { session })


        await session.commitTransaction();
        session.endSession();
        return transaction[0];
    } catch (error) {

        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}



const withdrawMoney = async (userId: string, amount: number) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        const user = await User.findById(userId);

        if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found")

        const userWallet = await Wallet.findOne({ user: userId }).session(session);

        if (!userWallet) throw new AppError(httpStatus.NOT_FOUND, "User wallet not found");

        if (userWallet.status === Status.BLOCKED as string) {
            throw new AppError(httpStatus.BAD_REQUEST, "User Wallet is blocked");
        }

        userWallet.balance -= amount;
        await userWallet.save({ session })

        const transaction = await Transaction.create([{
            from: user._id,
            to: "external_bank/atm_both",
            type: TRANSACTION_TYPE.WITHDRAW,
            amount,
            status: TRANSACTION_STATUS.COMPLETED
        }], { session })

        await session.commitTransaction();
        session.endSession();

        return transaction[0];
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

const sendMoney = async (senderId: string, payload: ISendMoney) => {
    const { receiverPhoneNumber, amount } = payload;
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const sender = await User.findById(senderId).session(session);
        const receiver = await User.findOne({ phoneNumber: receiverPhoneNumber }).session(session);

        if (receiver?.role !== Role.USER) throw new AppError(httpStatus.BAD_REQUEST, "Receiver is not a user account")

        if (!sender || !receiver) throw new AppError(httpStatus.NOT_FOUND, "Sender or receiver not found");
        if (sender._id.equals(receiver._id)) throw new AppError(httpStatus.BAD_REQUEST, "Cannot send money to yourself")

        const senderWallet = await Wallet.findOne({ user: senderId }).session(session);
        const receiverWallet = await Wallet.findOne({ user: receiver._id }).session(session);

        if (!senderWallet || !receiverWallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");

        if (senderWallet.status === Status.BLOCKED as string) {
            throw new AppError(httpStatus.BAD_REQUEST, "Sender Wallet is blocked");
        }

        if (receiverWallet.status === Status.BLOCKED as string) {
            throw new AppError(httpStatus.BAD_REQUEST, "Receiver Wallet is blocked");
        }

        if (senderWallet.balance < amount) throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");

        senderWallet.balance -= amount;
        receiverWallet.balance += amount;

        await senderWallet.save({ session });
        await receiverWallet.save({ session });
        const transactionId = generateTransactionId();

        const transaction = await Transaction.create([{
            from: sender._id,
            to: receiver._id,
            type: TRANSACTION_TYPE.SEND_MONEY,
            amount,
            transactionId,
            status: TRANSACTION_STATUS.COMPLETED
        }], { session })

        await session.commitTransaction();
        session.endSession();

        return transaction[0]
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

const cashIn = async (agentId: string, payload: ICashIn) => {
    const { userPhoneNumber, amount } = payload;

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const agent = await User.findById(agentId).session(session);

        if (!agent) throw new AppError(httpStatus.NOT_FOUND, "Agent not found");

        if (agent?.status === Status.PENDING as string) throw new AppError(httpStatus.FORBIDDEN, "Account is pending state");

        if (agent.role !== Role.AGENT) throw new AppError(httpStatus.BAD_REQUEST, "This is not an agent account");

        if (agent?.status === AgentRequestStatus.SUSPEND as string) throw new AppError(httpStatus.FORBIDDEN, "You are suspended contract with admin");

        const user = await User.findOne({ phoneNumber: userPhoneNumber }).session(session);
        if (!user || user.role === Role.AGENT) throw new AppError(httpStatus.NOT_FOUND, "User not found");
        if (user.role !== Role.USER) throw new AppError(httpStatus.BAD_REQUEST, "This is not a user account");

        const agentCommission = (amount * FEE_CONFIG.agentCommissionPercent) / 100;

        const agentWallet = await Wallet.findOne({ user: agentId }).session(session);
        const userWallet = await Wallet.findOne({ user: user._id }).session(session);

        if (!userWallet || !agentWallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found")

        if (agentWallet.status === Status.BLOCKED as string) {
            throw new AppError(httpStatus.FORBIDDEN, "Agent Wallet is blocked");
        }

        if (userWallet.status === Status.BLOCKED as string) {
            throw new AppError(httpStatus.FORBIDDEN, "User Wallet is blocked");
        }

        if (agentWallet.balance < amount) throw new AppError(httpStatus.BAD_REQUEST, "Agent has insufficient balance")

        agentWallet.balance -= amount;
        userWallet.balance += amount;
        agentWallet.balance += agentCommission;

        await agentWallet.save({ session });
        await userWallet.save({ session });

        const transactionId = generateTransactionId();

        const transaction = await Transaction.create([
            {
                from: agent._id,
                to: user._id,
                type: TRANSACTION_TYPE.CASH_IN,
                amount,
                agentCommission: agentCommission,
                transactionId,
                status: TRANSACTION_STATUS.COMPLETED
            }
        ], { session });

        await session.commitTransaction();
        session.endSession();

        return transaction[0];
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error
    }
}

const cashOut = async (userId: string, payload: ICashOut) => {
    const { agentPhoneNumber, amount } = payload;

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const user = await User.findById(userId).session(session);
        if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found")
        if (user.role !== Role.USER) throw new AppError(httpStatus.FORBIDDEN, "This is not a user account")

        const agent = await User.findOne({ phoneNumber: agentPhoneNumber }).session(session);

        if (agent?.status === Status.PENDING as string) throw new AppError(httpStatus.FORBIDDEN, "Account is pending");

        if (!agent || agent.role === Role.USER) throw new AppError(httpStatus.NOT_FOUND, "Agent not found");

        if (agent.role !== Role.AGENT) throw new AppError(httpStatus.FORBIDDEN, "This is not an agent account");

        if (agent?.status === AgentRequestStatus.SUSPEND as string) throw new AppError(httpStatus.FORBIDDEN, "Agent is suspended try another agent");

        const fee = (amount * FEE_CONFIG.cashOutFeePercent) / 100;
        const totalDeduction = amount + fee;
        const agentCommission = (amount * FEE_CONFIG.agentCommissionPercent) / 100;

        const agentWallet = await Wallet.findOne({ user: agent._id }).session(session);
        const userWallet = await Wallet.findOne({ user: userId }).session(session);

        if (!userWallet || !agentWallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found")

        if (agentWallet.status === Status.BLOCKED as string) {
            throw new AppError(httpStatus.FORBIDDEN, "Agent Wallet is blocked");
        }

        if (userWallet.status === Status.BLOCKED as string) {
            throw new AppError(httpStatus.FORBIDDEN, "User Wallet is blocked");
        }

        if (userWallet.balance < totalDeduction) throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance")

        agentWallet.balance += amount + agentCommission;
        userWallet.balance -= totalDeduction;

        await agentWallet.save({ session });
        await userWallet.save({ session });

        const transactionId = generateTransactionId();

        const transaction = await Transaction.create([
            {
                from: user._id,
                to: agent._id,
                type: TRANSACTION_TYPE.CASH_OUT,
                fee: fee,
                agentCommission: agentCommission,
                amount,
                transactionId,
                status: TRANSACTION_STATUS.COMPLETED
            }
        ], { session });

        await session.commitTransaction();
        session.endSession();

        return transaction[0];
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}


////////////////////////////////////////////////////////////



const getMyTransactionHistory = async (id: string) => {
    const user = await User.findById(id)

    if (user?.status === AgentRequestStatus.SUSPEND as string) throw new AppError(httpStatus.FORBIDDEN, "You are suspended contract with admin")

    const userObjectId = new Types.ObjectId(id);

    const transactions = await Transaction.find({
        $or: [
            { from: userObjectId },
            { to: userObjectId }
        ]
    }).sort({ createdAt: -1 })

    if (!transactions) throw new AppError(httpStatus.NOT_FOUND, "Transactions not found")

    return transactions;
}

const getAgentCommission = async (id: string) => {
    const user = await User.findById(id)

    if (user?.status === AgentRequestStatus.SUSPEND as string) throw new AppError(httpStatus.FORBIDDEN, "You are suspended contract with admin");

    const userObjectId = new Types.ObjectId(id);

    const transactions = await Transaction.find({
        $or: [
            { from: userObjectId },
            { to: userObjectId }
        ]
    }).sort({ createdAt: -1 }).select("-amount -fee -status")

    if (!transactions) throw new AppError(httpStatus.NOT_FOUND, "Commissions not found")

    return transactions;
}

export const transactionService = {
    addMoney,
    withdrawMoney,
    sendMoney,
    cashIn,
    cashOut,
    getMyTransactionHistory,
    getAgentCommission
}