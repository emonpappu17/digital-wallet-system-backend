import { Role } from "../user/user.interface";
import { User } from "../user/user.model"
import { Wallet } from "../wallet.ts/wallet.model";
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from "./transaction.interface";
import { Transaction } from "./transaction.model";

interface ICash {
    phoneNumber: string,
    amount: number
}

const cashIn = async (agentId: string, payload: ICash) => {
    const { phoneNumber, amount } = payload;

    const agent = await User.findById(agentId);

    if (!agent || agent.role !== Role.AGENT) throw new Error("Invalid agent")

    const user = await User.findOne({ phoneNumber: phoneNumber })

    if (!user) throw new Error("User not found")

    const agentWallet = await Wallet.findOne({ user: agentId });
    const userWallet = await Wallet.findOne({ user: user._id });

    if (!userWallet || !agentWallet) throw new Error("Wallet not found")

    if (agentWallet.balance < amount) throw new Error("Insufficient balance")

    agentWallet.balance -= amount;
    userWallet.balance += amount;

    await agentWallet.save();
    await userWallet.save();

    const transaction = await Transaction.create({
        from: agentId,
        to: user._id,
        type: TRANSACTION_TYPE.CASH_IN,
        amount,
        status: TRANSACTION_STATUS.COMPLETED
    })

    return transaction;
}

const cashOut = async (userId: string, payload: ICash) => {
    const { phoneNumber, amount } = payload;

    const user = await User.findById(userId);

    console.log({user});

    if (!user || user.role !== Role.USER) throw new Error("Invalid user")

    const agent = await User.findOne({ phoneNumber: phoneNumber })

    if (!agent) throw new Error("Agent not found")

    const agentWallet = await Wallet.findOne({ user: agent._id });
    const userWallet = await Wallet.findOne({ user: userId });

    if (!userWallet || !agentWallet) throw new Error("Wallet not found")

    if (userWallet.balance < amount) throw new Error("Insufficient balance")

    agentWallet.balance += amount;
    userWallet.balance -= amount;

    await agentWallet.save();
    await userWallet.save();

    const transaction = await Transaction.create({
        from: userId,
        to: agent._id,
        type: TRANSACTION_TYPE.CASH_OUT,
        amount,
        status: TRANSACTION_STATUS.COMPLETED
    })

    return transaction;
}

export const transactionService = {
    cashIn,
    cashOut
}