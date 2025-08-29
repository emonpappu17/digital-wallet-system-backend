import mongoose from "mongoose";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { Transaction } from "../transaction/transaction.model";
import { IUser, Role, Status } from "../user/user.interface";
import { User } from "../user/user.model";
import { Wallet } from "../wallet.ts/wallet.model";
import { AgentRequestStatus, IAgentRequest } from "./agentRequest.interface"
import { AgentRequest } from "./agentRequest.model";
import bcrypt from 'bcrypt';
import httpStatus from "http-status-codes"


const createAgentRequest = async (payload: Partial<IAgentRequest>) => {
    const { phoneNumber, password, email, ...rest } = payload;

    const isUserExist = await User.findOne({
        $or: [{ phoneNumber }, { email }]
    })

    if (isUserExist?.role === Role.AGENT && isUserExist?.status === Status.PENDING) throw new AppError(httpStatus.BAD_REQUEST, "This request already in pending")

    if (isUserExist) throw new AppError(httpStatus.BAD_REQUEST, "Already have account")
    // if (isUserExist?.role === Role.USER) throw new AppError(httpStatus.BAD_REQUEST, "This credentials have User account, can not send Agent request")
    // if (isUserExist?.role === Role.AGENT) throw new AppError(httpStatus.BAD_REQUEST, "You are already Agent!")

    // const isAgentExist = await AgentRequest.findOne({
    //     $or: [{ phoneNumber }, { email }]
    // })

    // if (isAgentExist) throw new AppError(httpStatus.BAD_REQUEST, "You have already requested to become Agent!!")

    const hashedPassword = await bcrypt.hash(password as string, Number(envVars.BCRYPT_SALT_ROUND))

    // const agentRequest = await AgentRequest.create({
    //     phoneNumber,
    //     password: hashedPassword,
    //     email,
    //     ...rest
    // })

    const agentRequest = await User.create({
        email: email,
        phoneNumber: phoneNumber,
        password: hashedPassword,
        role: Role.AGENT,
        status: Status.PENDING,
        ...rest
    })


    const { password: pas, ...agentInfo } = agentRequest.toObject();

    return agentInfo;
}

const getAllAgentRequests = async () => {
    const requests = await AgentRequest.find().select("-password");

    if (!requests) throw new AppError(httpStatus.NOT_FOUND, "No request found")

    return requests;
}

const approveAgentRequest = async (id: string) => {
    const user = await User.findById(id);

    if (user?.role === Role.USER || user?.role === Role.ADMIN) throw new AppError(httpStatus.BAD_REQUEST, "User or Admin cannot be approved!!");

    if (user?.status === Status.SUSPEND as string) {
        const request = await User.findByIdAndUpdate(id, { status: Status.ACTIVE }, { new: true })
        const wallet = await Wallet.findOne({ user: request?._id })
        if (!wallet) {
            await Wallet.create({
                user: request?._id,
                balance: 50
            })
        }

        if (!request) throw new AppError(httpStatus.BAD_REQUEST, "Request not found")

        const { password, ...rest } = request?.toObject();

        return rest
    }

    if (user?.status === Status.ACTIVE) throw new AppError(httpStatus.BAD_REQUEST, "User are already approved to Agent")

    const agentUser = await User.findByIdAndUpdate(id, { status: Status.ACTIVE }, { new: true })

    if (!agentUser) throw new AppError(httpStatus.NOT_FOUND, "Request not found")

    await Wallet.create({
        user: agentUser?._id,
        balance: 50
    })

    const { password, ...rest } = agentUser?.toObject();

    return rest
}

const suspendAgent = async (id: string) => {
    const user = await User.findById(id);

    if (user?.role === Role.USER) throw new AppError(httpStatus.FORBIDDEN, "User cannot be suspend!!")

    const admin = await User.findById(id);

    if (user?.role === Role.ADMIN) throw new AppError(httpStatus.FORBIDDEN, "Admin cannot be suspend!!")

    const agent = await User.findByIdAndUpdate(id, { status: AgentRequestStatus.SUSPEND }, { new: true }).select("-password")

    const update = await AgentRequest.findOneAndUpdate({
        $or: [{ phoneNumber: agent?.phoneNumber }, { email: agent?.email }]
    }, { status: AgentRequestStatus.SUSPEND }, { new: true })

    if (!agent || agent.role !== Role.AGENT) throw new AppError(httpStatus.NOT_FOUND, "Agent not found")
    return agent;
}

const getAgent = async (payload: Partial<IUser>) => {
    const { phoneNumber } = payload;

    const agent = await User.findOne({
        $or: [{ phoneNumber }]
    }).select('-password')

    if (!agent) throw new AppError(httpStatus.NOT_FOUND, "Account not found")

    if (agent.role !== Role.AGENT) throw new AppError(httpStatus.NOT_FOUND, "Not a agent account!")

    if (agent.status !== Status.ACTIVE || agent.role !== Role.AGENT) throw new AppError(httpStatus.NOT_FOUND, "Selected account is not active account!")

    return agent;
}

const getAgentStats = async (agentId: string, query: Record<string, string>) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const search = query.search;
    const type = query.type; 
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;

    const skip = (page - 1) * limit;
    const objectId = new mongoose.Types.ObjectId(agentId);
    // const txCollName = Transaction.collection.name;
    const userCollName = User.collection.name;

    //  agent info
    const agent = await User.findById(agentId).select("name email phoneNumber shopName role status");
    if (!agent) throw new AppError(httpStatus.NOT_FOUND, "Agent not found");

    //  wallet 
    const wallet = await Wallet.findOne({ user: objectId }).select("balance");

    const matchConditions: any = {
        $or: [
            { from: objectId },
            { to: objectId }
        ]
    };
    if (type) matchConditions.type = type;
    if (dateFrom || dateTo) matchConditions.createdAt = {};
    if (dateFrom) matchConditions.createdAt.$gte = dateFrom;
    if (dateTo) matchConditions.createdAt.$lte = dateTo;

    const pipeline: mongoose.PipelineStage[] = [
        { $match: matchConditions },

        {
            $lookup: {
                from: userCollName,
                localField: "from",
                foreignField: "_id",
                as: "fromUser"
            }
        },
        { $unwind: "$fromUser" },

        {
            $lookup: {
                from: userCollName,
                localField: "to",
                foreignField: "_id",
                as: "toUser"
            }
        },
        { $unwind: "$toUser" }
    ];

    if (search) {
        const s = search.trim();
        pipeline.push({
            $match: {
                $or: [
                    // { _id: { $regex: s, $options: "i" } }, 
                    { "fromUser.name": { $regex: s, $options: "i" } },
                    { "fromUser.email": { $regex: s, $options: "i" } },
                    { "fromUser.phoneNumber": { $regex: s, $options: "i" } },
                    { "toUser.name": { $regex: s, $options: "i" } },
                    { "toUser.email": { $regex: s, $options: "i" } },
                    { "toUser.phoneNumber": { $regex: s, $options: "i" } }
                ]
            }
        });
    }

    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Transaction.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Stats
    const statsPipeline: mongoose.PipelineStage[] = [
        ...pipeline,
        {
            $group: {
                _id: null,
                totalHandled: { $sum: "$amount" },
                totalCommission: { $sum: { $ifNull: ["$agentCommission", 0] } },
                // totalFees: { $sum: { $ifNull: ["$fee", 0] } },
                txCount: { $sum: 1 },
                totalCashInHandled: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$type", "CASH_IN"] },
                                    { $eq: ["$fromUser._id", objectId] } 
                                ]
                            },
                            "$amount",
                            0
                        ]
                    }
                },
                totalCashOutHandled: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$type", "CASH_OUT"] },
                                    { $eq: ["$toUser._id", objectId] } 
                                ]
                            },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        }
    ];

    const statsResult = await Transaction.aggregate(statsPipeline);
    const statsAgg = statsResult[0] || {
        totalHandled: 0,
        totalCommission: 0,
        // totalFees: 0,
        txCount: 0,
        totalCashInHandled: 0,
        totalCashOutHandled: 0
    };

    const listPipeline: mongoose.PipelineStage[] = [
        ...pipeline,

        {
            $project: {
                _id: 1,
                amount: 1,
                type: 1,
                // fee: 1,
                agentCommission: 1,
                status: 1,
                createdAt: 1,
                // from: "$fromUser._id",
                fromName: "$fromUser.name",
                fromPhone: "$fromUser.phoneNumber",
                fromRole: "$fromUser.role",
                // to: "$toUser._id",
                toName: "$toUser.name",
                toPhone: "$toUser.phoneNumber",
                toRole: "$toUser.role",

                counterpartName: {
                    $cond: [{ $eq: ["$fromUser._id", objectId] }, "$toUser.name", "$fromUser.name"]
                },
                counterpartPhone: {
                    $cond: [{ $eq: ["$fromUser._id", objectId] }, "$toUser.phoneNumber", "$fromUser.phoneNumber"]
                },
                counterpartRole: {
                    $cond: [{ $eq: ["$fromUser._id", objectId] }, "$toUser.role", "$fromUser.role"]
                },
         
                direction: {
                    $cond: [{ $eq: ["$fromUser._id", objectId] }, "OUT", "IN"]
                },
            }
        },

        // sorting & pagination
        { $sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 } },
        { $skip: skip },
        { $limit: limit }
    ];

    const transactions = await Transaction.aggregate(listPipeline);

    return {
        agent: {
            id: agent._id,
            name: agent.name,
            email: agent.email,
            phoneNumber: agent.phoneNumber,
            shopName: (agent as any).shopName,
            role: agent.role,
            status: agent.status
        },
        wallet: {
            balance: wallet?.balance || 0
        },
        summary: {
            totalHandledAmount: statsAgg.totalHandled || 0,
            totalCashInHandled: statsAgg.totalCashInHandled || 0,
            totalCashOutHandled: statsAgg.totalCashOutHandled || 0,
            totalCommissionEarned: statsAgg.totalCommission || 0,
            totalTransactions: statsAgg.txCount || 0
        },
        transactions,
        meta: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
        }
    };
};


export const agentRequestService = {
    createAgentRequest,
    approveAgentRequest,
    getAllAgentRequests,
    suspendAgent,
    getAgent,
    getAgentStats
}