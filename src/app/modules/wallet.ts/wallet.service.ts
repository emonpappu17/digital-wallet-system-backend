import AppError from "../../errorHelpers/AppError";
import { AgentRequestStatus } from "../agentRequest/agentRequest.interface";
import { Role, Status } from "../user/user.interface";
import { User } from "../user/user.model";
import { Wallet } from "./wallet.model";
import httpStatus from "http-status-codes";

interface IFund {
    agentNumber: string,
    amount: number
}

const fundAgentWallet = async (payload: IFund) => {
    const { agentNumber, amount } = payload;

    const user = await User.findOne({ phoneNumber: agentNumber });

    if (!user || user.role !== Role.AGENT) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid agent number")
    }

    const wallet = await Wallet.findOne({ user: user._id });

    if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Agent wallet not found")

    wallet.balance += amount;

    await wallet.save();
}

const myWallet = async (id: string) => {

    const user = await User.findById(id)

    if (user?.status === AgentRequestStatus.SUSPEND as string) throw new AppError(httpStatus.FORBIDDEN, "You are suspended contract with admin")

    const wallet = await Wallet.findOne({ user: id }).populate("user", "name phoneNumber role");

    if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found")

    return wallet;
}

const blockWallet = async (id: string) => {

    const wallet = await Wallet.findByIdAndUpdate(id, { status: Status.BLOCKED }, { new: true }).populate("user", "name phoneNumber role")

    if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found")

    return wallet;
}

const unblockWallet = async (id: string) => {

    const wallet = await Wallet.findByIdAndUpdate(id, { status: Status.ACTIVE }, { new: true }).populate("user", "name phoneNumber role")

    if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found")

    return wallet;
}

export const walletService = {
    fundAgentWallet,
    myWallet,
    blockWallet,
    unblockWallet
}