import mongoose, { MongooseError, Types } from "mongoose";
import { Role } from "../user/user.interface";
import { User } from "../user/user.model"
import { Wallet } from "../wallet.ts/wallet.model";
import { ITransaction, TRANSACTION_STATUS, TRANSACTION_TYPE } from "./transaction.interface";
import { Transaction } from "./transaction.model";

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

        if (!user) throw new Error("User not found")

        const userWallet = await Wallet.findOne({ user: userId }).session(session);
        if (!userWallet) throw new Error("User Wallet not found");

        userWallet.balance += amount;
        await userWallet.save();

        const transaction = await Transaction.create([
            {
                from: "external_bank/credit_card",
                to: user._id,
                type: TRANSACTION_TYPE.ADD_MONEY,
                amount,
                status: TRANSACTION_STATUS.COMPLETED
            }
        ], { session })

        await session.commitTransaction();
        session.endSession;

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

        if (!user) throw new Error("User not found")

        const userWallet = await Wallet.findOne({ user: userId }).session(session);
        if (!userWallet) throw new Error("User wallet not found");

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

        if (receiver?.role !== Role.USER) throw new Error("Receiver is not a user account")

        if (!sender || !receiver) throw new Error("Sender or receiver not found");
        if (sender._id.equals(receiver._id)) throw new Error("Cannot send money to yourself")

        const senderWallet = await Wallet.findOne({ user: senderId }).session(session);
        const receiverWallet = await Wallet.findOne({ user: receiver._id }).session(session);

        if (!senderWallet || !receiverWallet) throw new Error("Wallet not found");
        if (senderWallet.balance < amount) throw new Error("Insufficient balance")

        senderWallet.balance -= amount;
        receiverWallet.balance += amount;

        await senderWallet.save({ session });
        await receiverWallet.save({ session });

        const transaction = await Transaction.create([{
            from: sender._id,
            to: receiver._id,
            type: TRANSACTION_TYPE.SEND_MONEY,
            amount,
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
        if (!agent) throw new Error("Agent not found");
        if (agent.role !== Role.AGENT) throw new Error("This is not an agent account");

        const user = await User.findOne({ phoneNumber: userPhoneNumber }).session(session);
        if (!user || user.role === Role.AGENT) throw new Error("User not found");
        if (user.role !== Role.USER) throw new Error("This is not a user account");

        const agentWallet = await Wallet.findOne({ user: agentId }).session(session);
        const userWallet = await Wallet.findOne({ user: user._id }).session(session);

        if (!userWallet || !agentWallet) throw new Error("Wallet not found")
        if (agentWallet.balance < amount) throw new Error("Agent has insufficient balance")

        agentWallet.balance -= amount;
        userWallet.balance += amount;

        await agentWallet.save({ session });
        await userWallet.save({ session });

        const transaction = await Transaction.create([
            {
                from: agent._id,
                to: user._id,
                type: TRANSACTION_TYPE.CASH_IN,
                amount,
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
        if (!user) throw new Error("User not found")
        if (user.role !== Role.USER) throw new Error("This is not a user account")

        const agent = await User.findOne({ phoneNumber: agentPhoneNumber }).session(session)
        if (!agent || agent.role === Role.USER) throw new Error("Agent not found")
        if (agent.role !== Role.AGENT) throw new Error("This is not an agent account");

        const agentWallet = await Wallet.findOne({ user: agent._id }).session(session);
        const userWallet = await Wallet.findOne({ user: userId }).session(session);

        if (!userWallet || !agentWallet) throw new Error("Wallet not found")
        if (userWallet.balance < amount) throw new Error("Insufficient balance")

        agentWallet.balance += amount;
        userWallet.balance -= amount;

        await agentWallet.save({ session });
        await userWallet.save({ session });

        const transaction = await Transaction.create([
            {
                from: user._id,
                to: agent._id,
                type: TRANSACTION_TYPE.CASH_OUT,
                amount,
                status: TRANSACTION_STATUS.COMPLETED
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

const getMyTransactionHistory = async (id: string) => {
    console.log({ id });
    const userObjectId = new Types.ObjectId(id);
    console.log({ userObjectId });

    const transactions = await Transaction.find({
        $or: [
            { from: userObjectId },
            { to: userObjectId }
        ]
    }).sort({ createdAt: -1 })

    console.log({ transactions });

    if (!transactions) throw new Error("Transactions not found")

    return transactions;
}

export const transactionService = {
    addMoney,
    withdrawMoney,
    sendMoney,
    cashIn,
    cashOut,
    getMyTransactionHistory
}