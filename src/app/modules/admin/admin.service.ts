import httpStatus from "http-status-codes"
import mongoose from "mongoose"
import AppError from "../../errorHelpers/AppError"
import { Transaction } from "../transaction/transaction.model"
import { Role } from "../user/user.interface"
import { User } from "../user/user.model"
import { Wallet } from "../wallet.ts/wallet.model"
////////////////////////////////////////

const getAllAgents = async (query: Record<string, string>) => {
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
            { phoneNumber: { $regex: search, $options: 'i' } },
            { shopName: { $regex: search, $options: 'i' } }
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
                ...(maxBalance !== undefined && { balance: { $lte: maxBalance } }),
                ...(minCommission !== undefined && { commission: { $gte: minCommission } }),
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

    // Pipeline for overall statistics (without filters except role)
    const statisticsPipeline: mongoose.PipelineStage[] = [
        // Match only agents (no other filters applied)
        { $match: { role: Role.AGENT } },

        // Lookup wallet
        {
            $lookup: {
                from: walletCollName,
                localField: "_id",
                foreignField: "user",
                as: "wallet"
            }
        },

        // Unwind wallet
        {
            $unwind: { path: "$wallet", preserveNullAndEmptyArrays: true }
        },

        // Lookup transactions
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

        // Add calculated fields
        {
            $addFields: {
                transactionsCount: { $size: { $ifNull: ["$transactions", []] } },
                transactionVolume: {
                    $reduce: {
                        input: { $ifNull: ["$transactions", []] },
                        initialValue: 0,
                        in: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] },
                    }
                }
            }
        },

        // Group to calculate overall statistics
        {
            $group: {
                _id: null,
                totalAgents: { $sum: 1 },
                totalActiveAgents: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0]
                    }
                },
                totalPendingAgents: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0]
                    }
                },
                totalSuspendedAgents: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "SUSPEND"] }, 1, 0]
                    }
                },
                totalTransactions: { $sum: "$transactionsCount" },
                totalVolume: { $sum: "$transactionVolume" }
            }
        }
    ];

    // Create separate pipeline for counting filtered documents
    const countPipeline = [...pipeline, { $count: "total" }];

    // Add sorting
    const sortStage: any = {};
    sortStage[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortStage });

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute all queries in parallel
    const [agentsWithStats, countResult, statisticsResult] = await Promise.all([
        User.aggregate(pipeline).exec(),
        User.aggregate(countPipeline).exec(),
        User.aggregate(statisticsPipeline).exec()
    ]);

    const totalCount = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    const statistics = statisticsResult[0] || {
        totalAgents: 0,
        totalActiveAgents: 0,
        totalPendingAgents: 0,
        totalSuspendedAgents: 0,
        totalTransactions: 0,
        totalVolume: 0
    };

    // console.log('agentsWithStats==>', agentsWithStats);
    // console.log('statistics==>', statistics);

    return {
        agents: agentsWithStats,
        pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            // hasNext: page < totalPages,
            // hasPrev: page > 1,
            limit
        },
        statistics: {
            totalAgents: statistics.totalAgents,
            totalActiveAgents: statistics.totalActiveAgents,
            totalPendingAgents: statistics.totalPendingAgents,
            totalSuspendedAgents: statistics.totalSuspendedAgents,
            totalTransactions: statistics.totalTransactions,
            totalVolume: statistics.totalVolume
        }
    };
};

const getAllUsers = async (query: Record<string, string>) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const search = query.search;
    const status = query.status;
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    const minTransactionVolume = query.minTransactionVolume ? parseFloat(query.minTransactionVolume) : undefined;

    const skip = (page - 1) * limit;
    const walletCollName = Wallet.collection.name;
    const txCollName = Transaction.collection.name;

    const matchConditions: any = { role: Role.USER };
    if (search) {
        matchConditions.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
        ];
    }

    if (status) {
        matchConditions.status = status;
    }

    if (dateFrom || dateTo) {
        matchConditions.createdAt = {};
        if (dateFrom) matchConditions.createdAt.$gte = new Date(dateFrom);
        if (dateTo) matchConditions.createdAt.$lte = new Date(dateTo);
    }

    const pipeline: mongoose.PipelineStage[] = [
        // Step-1
        { $match: matchConditions },

        // Step-2
        {
            $lookup: {
                from: walletCollName,
                localField: "_id",
                foreignField: "user",
                as: "wallet"
            }
        },

        // Step-3
        {
            $unwind: { path: "$wallet", preserveNullAndEmptyArrays: true }
        },

        // Step-4
        {
            $lookup: {
                from: txCollName,
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$status", "COMPLETED"] },
                                    {
                                        $or: [
                                            { $eq: ["$from", "$$userId"] },
                                            { $eq: ["$to", "$$userId"] },
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    { $project: { amount: 1, createdAt: 1 } }
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
                balance: { $ifNull: ["$wallet.balance", 0] },
            }
        },

        // Step-6
        {
            $match: {
                ...(minTransactionVolume !== undefined && { transactionVolume: { $gte: minTransactionVolume } }),
            }
        },

        // Step-7
        {
            $project: {
                password: 0,
                wallet: 0,
            }
        }
    ];

    
    const statisticsPipeline: mongoose.PipelineStage[] = [
        { $match: { role: Role.USER } },

        {
            $lookup: {
                from: walletCollName,
                localField: "_id",
                foreignField: "user",
                as: "wallet"
            }
        },

        {
            $unwind: { path: "$wallet", preserveNullAndEmptyArrays: true }
        },

        {
            $lookup: {
                from: txCollName,
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$status", "COMPLETED"] },
                                    {
                                        $or: [
                                            { $eq: ["$from", "$$userId"] },
                                            { $eq: ["$to", "$$userId"] },
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    { $project: { amount: 1, createdAt: 1 } }
                ],
                as: "transactions",
            }
        },

        {
            $addFields: {
                transactionsCount: { $size: { $ifNull: ["$transactions", []] } },
                transactionVolume: {
                    $reduce: {
                        input: { $ifNull: ["$transactions", []] },
                        initialValue: 0,
                        in: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] },
                    }
                }
            }
        },

        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                totalActiveUsers: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0]
                    }
                },
                totalBlockedUsers: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "BLOCKED"] }, 1, 0]
                    }
                },
                totalTransactions: { $sum: "$transactionsCount" },
                totalVolume: { $sum: "$transactionVolume" }
            }
        }
    ];

    const countPipeline = [...pipeline, { $count: "total" }];

    const sortStage: any = {};
    sortStage[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortStage });

    //  pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const [usersWithStats, countResult, statisticsResult] = await Promise.all([
        User.aggregate(pipeline).exec(),
        User.aggregate(countPipeline).exec(),
        User.aggregate(statisticsPipeline).exec()
    ]);

    const totalCount = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    const statistics = statisticsResult[0] || {
        totalUsers: 0,
        totalActiveUsers: 0,
        totalBlockedUsers: 0,
        totalTransactions: 0,
        totalVolume: 0
    };

    return {
        users: usersWithStats,
        pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            // hasNext: page < totalPages,
            // hasPrev: page > 1,
            limit
        },
        statistics: {
            totalUsers: statistics.totalUsers,
            totalActiveUsers: statistics.totalActiveUsers,
            totalBlockedUsers: statistics.totalBlockedUsers,
            totalTransactions: statistics.totalTransactions,
            totalVolume: statistics.totalVolume
        }
    };
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

export const getAllUserStats = async (query: Record<string, string>) => {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const sortBy = (query.sortBy as string) || "createdAt";
    const sortOrder = (query.sortOrder as string) === "asc" ? 1 : -1;
    const search = (query.search || "").trim();
    const type = query.type as string | undefined;
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    const roleFilter = (query.role as string | undefined)?.toUpperCase();

    const skip = (page - 1) * limit;

    const userCollName = User.collection.name;

    const userMatch: any = {};
    if (roleFilter) userMatch.role = roleFilter;
    if (search) {
        const s = new RegExp(search, "i");
        userMatch.$or = [
            { name: { $regex: s } },
            { email: { $regex: s } },
            { phoneNumber: { $regex: s } }
        ];
    }

    const totalUsers = await User.countDocuments(userMatch);
    const totalAgents = await User.countDocuments({ role: "AGENT" });

    const txMatch: any = {};

    if (type) txMatch.type = type;
    if (dateFrom || dateTo) {
        txMatch.createdAt = {};
        if (dateFrom) txMatch.createdAt.$gte = dateFrom;
        if (dateTo) txMatch.createdAt.$lte = dateTo;
    }

    const baseTxPipeline: mongoose.PipelineStage[] = [{ $match: txMatch }];

    baseTxPipeline.push(
        {
            $lookup: {
                from: userCollName,
                localField: "from",
                foreignField: "_id",
                as: "fromUser"
            }
        },
        { $unwind: { path: "$fromUser", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: userCollName,
                localField: "to",
                foreignField: "_id",
                as: "toUser"
            }
        },
        { $unwind: { path: "$toUser", preserveNullAndEmptyArrays: true } }
    );

    if (search) {
        const s = new RegExp(search, "i");
        baseTxPipeline.push({
            $match: {
                $or: [
                    { _id: { $regex: search } },
                    { "fromUser.name": { $regex: s } },
                    { "fromUser.email": { $regex: s } },
                    { "fromUser.phoneNumber": { $regex: s } },
                    { "toUser.name": { $regex: s } },
                    { "toUser.email": { $regex: s } },
                    { "toUser.phoneNumber": { $regex: s } },
                    { amount: isNaN(Number(search)) ? -1 : Number(search) }
                ]
            }
        });
    }

    const txCountPipeline = [...baseTxPipeline, { $count: "total" }];
    const txCountResult = await Transaction.aggregate(txCountPipeline);
    const totalTxCount = txCountResult[0]?.total || 0;
    const txTotalPages = Math.ceil(totalTxCount / limit);

    const statsPipeline: mongoose.PipelineStage[] = [
        ...baseTxPipeline,
        {
            $group: {
                _id: null,
                totalVolume: { $sum: "$amount" },
                totalTransactions: { $sum: 1 },
                totalCommission: { $sum: { $ifNull: ["$agentCommission", 0] } },
                totalFees: { $sum: { $ifNull: ["$fee", 0] } },
                byType: {
                    $push: { type: "$type", amount: "$amount" }
                }
            }
        }
    ];
    const statsRes = await Transaction.aggregate(statsPipeline);
    const overallStats = statsRes[0] || {
        totalVolume: 0,
        totalTransactions: 0,
        totalCommission: 0,
        totalFees: 0,
        byType: []
    };

    //  Pie Chart Data 
    const pieChartPipeline: mongoose.PipelineStage[] = [
        { $match: { ...txMatch, status: "COMPLETED" } },
        {
            $group: {
                _id: "$type",
                totalAmount: { $sum: "$amount" },
                totalCount: { $sum: 1 },
                totalFees: { $sum: { $ifNull: ["$fee", 0] } },
                totalCommission: { $sum: { $ifNull: ["$agentCommission", 0] } }
            }
        },
        { $sort: { totalAmount: -1 } }
    ];
    const pieChartResult = await Transaction.aggregate(pieChartPipeline);
    const pieChartTotal = pieChartResult.reduce((sum, item) => sum + item.totalAmount, 0);

    const pieChartData = pieChartResult.map(item => ({
        type: item._id,
        totalAmount: item.totalAmount,
        percentage: pieChartTotal > 0 ? Math.round((item.totalAmount / pieChartTotal) * 100 * 100) / 100 : 0,
        count: item.totalCount,
        fees: item.totalFees,
        commission: item.totalCommission
    }));

    //  Bar Chart Data 
    const barChartDateFrom = dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const barChartDateTo = dateTo || new Date();

    const barChartPipeline: mongoose.PipelineStage[] = [
        {
            $match: {
                ...txMatch,
                status: "COMPLETED",
                createdAt: {
                    $gte: barChartDateFrom,
                    $lte: barChartDateTo
                }
            }
        },
        {
            $group: {
                _id: {
                    date: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    type: "$type"
                },
                totalAmount: { $sum: "$amount" },
                totalCount: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: "$_id.date",
                types: {
                    $push: {
                        type: "$_id.type",
                        amount: "$totalAmount",
                        count: "$totalCount"
                    }
                },
                totalAmount: { $sum: "$totalAmount" },
                totalCount: { $sum: "$totalCount" }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ];

    const barChartResult = await Transaction.aggregate(barChartPipeline);
    const barChartData = barChartResult.map(item => {
        const dateObj = item._id;
        const dateLabel = `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;

        const typeData: Record<string, number> = {};
        item.types.forEach((type: any) => {
            typeData[type.type] = type.amount;
        });

        return {
            date: dateLabel,
            totalAmount: item.totalAmount,
            totalCount: item.totalCount,
            ...typeData
        };
    });

    const listPipeline: mongoose.PipelineStage[] = [
        ...baseTxPipeline,
        {
            $project: {
                _id: 1,
                amount: 1,
                type: 1,
                fee: 1,
                agentCommission: 1,
                status: 1,
                createdAt: 1,
                from: "$fromUser._id",
                fromName: "$fromUser.name",
                fromEmail: "$fromUser.email",
                fromPhone: "$fromUser.phoneNumber",
                fromRole: "$fromUser.role",
                to: "$toUser._id",
                toName: "$toUser.name",
                toEmail: "$toUser.email",
                toPhone: "$toUser.phoneNumber",
                toRole: "$toUser.role",
                counterpart: {
                    $cond: [
                        { $and: [{ $ne: ["$fromUser", null] }, { $ne: ["$toUser", null] }] },
                        { from: "$fromUser.name", to: "$toUser.name" },
                        { from: "$fromUser.name", to: "$toUser.name" }
                    ]
                }
            }
        },
        { $sort: { [sortBy]: sortOrder } },
        { $skip: skip },
        { $limit: limit }
    ];
    const transactions = await Transaction.aggregate(listPipeline);

    return {
        totals: {
            totalUsers,
            totalAgents,
            totalTransactions: overallStats.totalTransactions || totalTxCount,
            totalTransactionVolume: overallStats.totalVolume || 0,
            totalCommission: overallStats.totalCommission || 0,
            totalFees: overallStats.totalFees || 0,
        },
        transactions: {
            list: transactions,
        },
       
        charts: {
            pieChart: {
                data: pieChartData,
                total: pieChartTotal
            },
            barChart: {
                data: barChartData,
                dateRange: {
                    from: barChartDateFrom,
                    to: barChartDateTo
                }
            }
        },
        meta: {
            currentPage: page,
            limit,
            totalPages: txTotalPages,
            totalCount: totalTxCount
        }
    };
};
export const adminService = {
    getAllUsers,
    getAllAgents,
    getAllWallets,
    getAllTransactions,
    getAllUserStats
}