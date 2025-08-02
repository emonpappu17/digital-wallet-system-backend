import AppError from "../../errorHelpers/AppError"
import { Transaction } from "../transaction/transaction.model"
import { Role } from "../user/user.interface"
import { User } from "../user/user.model"
import { Wallet } from "../wallet.ts/wallet.model"
import httpStatus from "http-status-codes"

const getAllUsers = async () => {
    const users = await User.find({ role: Role.USER }).select("-password").sort({ createdAt: -1 })

    if (!users) throw new AppError(httpStatus.NOT_FOUND, "Users not found")

    return users;
}

const getAllAgents = async () => {
    const agents = await User.find({ role: Role.AGENT }).select("-password").sort({ createdAt: -1 })

    if (!agents) throw new AppError(httpStatus.NOT_FOUND, "Agents not found")

    return agents;
}

const getAllWallets = async () => {
    const wallets = await Wallet.find().populate("user", "name phoneNumber role").sort({ createdAt: -1 })

    if (!wallets) throw new AppError(httpStatus.NOT_FOUND, "Wallets not found")

    return wallets;
}

const getAllTransactions = async () => {
    const transactions = await Transaction.find().sort({ createdAt: -1 })

    if (!transactions) throw new AppError(httpStatus.NOT_FOUND, "Transactions not found")

    return transactions;
}
export const adminService = {
    getAllUsers,
    getAllAgents,
    getAllWallets,
    getAllTransactions
}