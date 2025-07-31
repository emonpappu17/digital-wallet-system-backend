import { Transaction } from "../transaction/transaction.model"
import { Role } from "../user/user.interface"
import { User } from "../user/user.model"
import { Wallet } from "../wallet.ts/wallet.model"

const getAllUsers = async () => {
    const users = await User.find({ role: Role.USER })

    if (!users) throw new Error("Users not found")

    return users;
}

const getAllAgents = async () => {
    const agents = await User.find({ role: Role.AGENT })

    if (!agents) throw new Error("Agents not found")

    return agents;
}

const getAllWallets = async () => {
    const wallets = await Wallet.find().populate("user", "name phoneNumber role")

    if (!wallets) throw new Error("Wallets not found")

    return wallets;
}

const getAllTransactions = async () => {
    const transactions = await Transaction.find()

    if (!transactions) throw new Error("Transactions not found")

    return transactions;
}
export const adminService = {
    getAllUsers,
    getAllAgents,
    getAllWallets,
    getAllTransactions
}