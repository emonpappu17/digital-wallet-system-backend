import mongoose from "mongoose"
import AppError from "../../errorHelpers/AppError"
import { Transaction } from "../transaction/transaction.model"
import { Role } from "../user/user.interface"
import { Wallet } from "../wallet.ts/wallet.model"
import httpStatus from "http-status-codes"
import { User } from "../user/user.model"
////////////////////////////////////////

const getAllAgents = async (query: Record<string, string>) => {
    // Parse and extract query parameters with defaults
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const search = query.search;
    const status = query.status;
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    const minBalance = query.minBalance ? parseFloat(query.minBalance) : undefined;
    const maxBalance = query.maxBalance ? parseFloat(query.maxBalance) : undefined;
    const minCommission = query.minCommission ? parseFloat(query.minCommission) : undefined;
    const maxCommission = query.maxCommission ? parseFloat(query.maxCommission) : undefined;
    const minTransactionCount = query.minTransactionCount ? parseInt(query.minTransactionCount) : undefined;
    const maxTransactionCount = query.maxTransactionCount ? parseInt(query.maxTransactionCount) : undefined;
    const minTransactionVolume = query.minTransactionVolume ? parseFloat(query.minTransactionVolume) : undefined;
    const maxTransactionVolume = query.maxTransactionVolume ? parseFloat(query.maxTransactionVolume) : undefined;

    const skip = (page - 1) * limit;

    const walletCollName = Wallet.collection.name;
    const txCollName = Transaction.collection.name;

    // Build match conditions
    const matchConditions: any = { role: Role.AGENT };

    // Add search functionality
    if (search) {
        matchConditions.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } }
        ];
    }

    // Add status filter
    if (status) {
        matchConditions.status = status;
    }

    // Add date range filter
    if (dateFrom || dateTo) {
        matchConditions.createdAt = {};
        if (dateFrom) matchConditions.createdAt.$gte = new Date(dateFrom);
        if (dateTo) matchConditions.createdAt.$lte = new Date(dateTo);
    }

    // console.log('matchConditions==>', matchConditions);

    const pipeline: mongoose.PipelineStage[] = [
        // Step-1: Initial match
        { $match: matchConditions },

        // Step-2: Lookup wallet
        {
            $lookup: {
                from: walletCollName,
                localField: "_id",
                foreignField: "user",
                as: "wallet"
            }
        },

        // Step-3: Unwind wallet
        {
            $unwind: { path: "$wallet", preserveNullAndEmptyArrays: true }
        },

        // Step-4: Lookup transactions
        {
            $lookup: {
                from: txCollName,
                let: { agentId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$status", "COMPLETED"] },
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

        // Step-5: Add calculated fields
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

        // Step-6: Filter by calculated fields
        {
            $match: {
                ...(minBalance !== undefined && { balance: { $gte: minBalance } }),
                ...(maxBalance !== undefined && { balance: { ...matchConditions.balance, $lte: maxBalance } }),
                ...(minCommission !== undefined && { commission: { $gte: minCommission } }),
                ...(maxCommission !== undefined && { commission: { ...matchConditions.commission, $lte: maxCommission } }),
                ...(minTransactionCount !== undefined && { transactionsCount: { $gte: minTransactionCount } }),
                ...(maxTransactionCount !== undefined && { transactionsCount: { ...matchConditions.transactionsCount, $lte: maxTransactionCount } }),
                ...(minTransactionVolume !== undefined && { transactionVolume: { $gte: minTransactionVolume } }),
                ...(maxTransactionVolume !== undefined && { transactionVolume: { ...matchConditions.transactionVolume, $lte: maxTransactionVolume } })
            }
        },

        // Step-7: Project final fields
        {
            $project: {
                password: 0,
                wallet: 0,
                // transactions: 0 // uncomment if you don't want to return transactions
            }
        }
    ];

    // Create separate pipeline for counting total documents
    const countPipeline = [...pipeline, { $count: "total" }];

    // Add sorting
    const sortStage: any = {};
    sortStage[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortStage });

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute both queries in parallel
    const [agentsWithStats, countResult] = await Promise.all([
        User.aggregate(pipeline).exec(),
        User.aggregate(countPipeline).exec()
    ]);

    const totalCount = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // console.log('agentsWithStats==>', agentsWithStats);

    return {
        agents: agentsWithStats,
        pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            limit
        }
    };
};

///////////////////////////////////////



const getAllUsers = async () => {
    const users = await User.find({ role: Role.USER }).select("-password").sort({ createdAt: -1 })

    if (!users) throw new AppError(httpStatus.NOT_FOUND, "Users not found")

    return users;
}

// const getAllAgents = async () => {
//     // const agents = await User.find({ role: Role.AGENT }).select("-password").sort({ createdAt: -1 })
//     // if (!agents) throw new AppError(httpStatus.NOT_FOUND, "Agents not found")
//     // return agents;

//     // const user = User.collection.name
//     const walletCollName = Wallet.collection.name;
//     const txCollName = Transaction.collection.name;

//     const pipeline: mongoose.PipelineStage[] = [
//         // Step-1
//         { $match: { role: Role.AGENT } },
//         // Step-2
//         {
//             $lookup: {
//                 from: walletCollName,
//                 localField: "_id", // my agent id
//                 foreignField: "user", // wallet user which is my agent id
//                 as: "wallet"
//             }
//         },
//         // Step-3
//         {
//             // $unwind: "$wallet"
//             $unwind: { path: "$wallet", preserveNullAndEmptyArrays: true }
//         },
//         // Step-4
//         {
//             $lookup: {
//                 from: txCollName,
//                 let: { agentId: "$_id" },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     // only completed trans
//                                     { $eq: ["$status", "COMPLETED"] },
//                                     // agent involved if 'from' or 'to' matches agent id
//                                     {
//                                         $or: [
//                                             { $eq: ["$from", "$$agentId"] },
//                                             { $eq: ["$to", "$$agentId"] },
//                                         ]
//                                     }
//                                 ]
//                             }
//                         }
//                     },
//                     { $project: { amount: 1, agentCommission: 1, createdAt: 1 } }
//                 ],
//                 as: "transactions",
//             }
//         },
//         // Step-5
//         {
//             $addFields: {
//                 transactionsCount: { $size: { $ifNull: ["$transactions", []] } },
//                 transactionVolume: {
//                     $reduce: {
//                         input: { $ifNull: ["$transactions", []] },
//                         initialValue: 0,
//                         in: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] },
//                     }
//                 },
//                 commission: {
//                     $reduce: {
//                         input: { $ifNull: ["$transactions", []] },
//                         initialValue: 0,
//                         in: { $add: ["$$value", { $ifNull: ["$$this.agentCommission", 0] }] }

//                     }
//                 },
//                 balance: { $ifNull: ["$wallet.balance", 0] },
//             }
//         },
//         // Step-6
//         {
//             $project: {
//                 password: 0,
//                 wallet: 0,
//                 // transactions: 0
//             }
//         },
//         // Step-7
//         { $sort: { createAt: -1 } }

//     ];

//     const agentsWithStats = await User.aggregate(pipeline).exec();

//     console.log('agentsWithStats==>', agentsWithStats); //users

//     return agentsWithStats;
// }

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