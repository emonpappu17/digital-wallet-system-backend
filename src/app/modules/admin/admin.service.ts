import mongoose from "mongoose"
import AppError from "../../errorHelpers/AppError"
import { Transaction } from "../transaction/transaction.model"
import { Role } from "../user/user.interface"
import { Wallet } from "../wallet.ts/wallet.model"
import httpStatus from "http-status-codes"
import { User } from "../user/user.model"

const getAllUsers = async () => {
    const users = await User.find({ role: Role.USER }).select("-password").sort({ createdAt: -1 })

    if (!users) throw new AppError(httpStatus.NOT_FOUND, "Users not found")

    return users;
}

const getAllAgents = async () => {
    // const agents = await User.find({ role: Role.AGENT }).select("-password").sort({ createdAt: -1 })
    // if (!agents) throw new AppError(httpStatus.NOT_FOUND, "Agents not found")
    // return agents;

    // const user = User.collection.name
    const walletCollName = Wallet.collection.name;
    const txCollName = Transaction.collection.name;

    const pipeline: mongoose.PipelineStage[] = [
        // Step-1
        { $match: { role: Role.AGENT } },
        // Step-2
        {
            $lookup: {
                from: walletCollName,
                localField: "_id", // my agent id
                foreignField: "user", // wallet user which is my agent id
                as: "wallet"
            }
        },
        // Step-3
        {
            // $unwind: "$wallet"
            $unwind: { path: "$wallet", preserveNullAndEmptyArrays: true }
        },
        // Step-4
        {
            $lookup: {
                from: txCollName,
                let: { agentId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    // only completed trans
                                    { $eq: ["$status", "COMPLETED"] },
                                    // agent involved if 'from' or 'to' matches agent id
                                    {
                                        $or: [
                                            { $eq: ["$from", "$$agentId"] },
                                            { $eq: ["$to", "$$agentId"] },
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    { $project: { amount: 1, agentCommission: 1, createdAt: 1 } }
                ],
                as: "transactions",
            }
        },
        // Step-5
        {
            $addFields: {
                transactionsCount: { $size: { $ifNull: ["$transactions", []] } },
                transactionVolume: {
                    $reduce: {
                        input: { $ifNull: ["$transactions", []] },
                        initialValue: 0,
                        in: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] },
                    }
                },
                commission: {
                    $reduce: {
                        input: { $ifNull: ["$transactions", []] },
                        initialValue: 0,
                        in: { $add: ["$$value", { $ifNull: ["$$this.agentCommission", 0] }] }

                    }
                },
                balance: { $ifNull: ["$wallet.balance", 0] },
            }
        },
        // Step-6
        {
            $project: {
                password: 0,
                wallet: 0,
                // transactions: 0
            }
        },
        // Step-7
        { $sort: { createAt: -1 } }

    ];

    const agentsWithStats = await User.aggregate(pipeline).exec();

    console.log('agentsWithStats==>', agentsWithStats); //users

    return agentsWithStats;
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