import bcryptjs from 'bcryptjs';
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { AgentRequestStatus } from "../agentRequest/agentRequest.interface";
import { AgentRequest } from "../agentRequest/agentRequest.model";
import { Transaction } from "../transaction/transaction.model";
import { Wallet } from "../wallet.ts/wallet.model";
import { IUser, Role, Status } from "./user.interface";
import { User } from "./user.model";

const createUser = async (payload: IUser) => {
    const { phoneNumber, password, email, ...rest } = payload;

    console.log({ payload });

    const isUserExist = await User.findOne({
        $or: [{ phoneNumber }, { email }]
    })

    if (isUserExist) throw new AppError(httpStatus.BAD_REQUEST, "Account already exists");

    const isAgentExist = await AgentRequest.findOne({
        $or: [{ phoneNumber }, { email }]
    })

    if (isAgentExist) throw new AppError(httpStatus.BAD_REQUEST, "This credential is already using for Agent")

    const hashedPassword = await bcryptjs.hash(password, Number(envVars.BCRYPT_SALT_ROUND))

    const user = await User.create({
        phoneNumber,
        email,
        password: hashedPassword,
        ...rest
    })

    await Wallet.create({ user: user._id, balance: 50 });

    const { password: pass, ...userInfo } = user.toObject();

    return userInfo;
}

const myProfile = async (id: string) => {

    const user = await User.findById(id).select("-password");

    if (user?.status === AgentRequestStatus.SUSPEND as string) throw new AppError(httpStatus.FORBIDDEN, "You are suspended contract with admin");

    if (!user) throw new AppError(httpStatus.NOT_FOUND, "Profile not found")

    return user;
}


export const updateUser = async (
    payload: { oldPassword?: string; newPassword?: string, name: string, phoneNumber: string },
    decodedToken: JwtPayload
) => {
    // console.log(payload);
    const user = await User.findById(decodedToken.userId);

    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

    if (payload.oldPassword && payload.newPassword) {
        const isOldPasswordMatch = await bcryptjs.compare(
            payload.oldPassword,
            user.password
        );

        if (!isOldPasswordMatch) {
            throw new AppError(httpStatus.UNAUTHORIZED, "Old password does not match");
        }

        user.password = await bcryptjs.hash(
            payload.newPassword,
            Number(envVars.BCRYPT_SALT_ROUND)
        );
    }


    if (payload.name) {
        user.name = payload.name;
    }


    if (payload.phoneNumber) {
        const isPhoneExist = await User.findOne({ phoneNumber: payload.phoneNumber })

        if (isPhoneExist) throw new AppError(httpStatus.BAD_REQUEST, "Number is already exist")

        user.phoneNumber = payload.phoneNumber;
    }

    await user.save();

    const { password, ...updatedUser } = user.toObject();
    return updatedUser;
};


const unblockUser = async (id: string) => {
    const user = await User.findOne({ _id: id, role: Role.USER }).select("-password");

    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

    user.status = Status.ACTIVE;

    await user.save()

    return user;
}

const blockUser = async (id: string) => {
    const user = await User.findOne({ _id: id, role: Role.USER }).select("-password");

    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

    user.status = Status.BLOCKED
    await user.save()

    return user;
}

const getUser = async (payload: Partial<IUser>) => {
    const { phoneNumber, email } = payload;

    const user = await User.findOne({
        $or: [{ phoneNumber }, { email }]
    }).select('-password')

    if (!user) throw new AppError(httpStatus.NOT_FOUND, "Account not found")

    if (user.role !== Role.USER) throw new AppError(httpStatus.NOT_FOUND, "Not a user account")

    if (user.status !== Status.ACTIVE) throw new AppError(httpStatus.NOT_FOUND, "Selected account is not active account!")

    return user;
}

const getUserStats = async (userId: string, query: Record<string, string>) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const search = query.search;
    const type = query.type; 
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    const skip = (page - 1) * limit;
    const objectId = new mongoose.Types.ObjectId(userId);
    const txCollName = Transaction.collection.name;
    const userCollName = User.collection.name;

    //  user info
    const user = await User.findById(userId).select("name email phoneNumber");
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

    //  wallet
    const wallet = await Wallet.findOne({ user: objectId }).select("balance");

    const matchConditions: any = { $or: [{ from: objectId }, { to: objectId }] };
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
        { $unwind: "$toUser" },

        ...(search ? [{
            $match: {
                $or: [
                    { "fromUser.name": { $regex: search, $options: "i" } },
                    { "fromUser.email": { $regex: search, $options: "i" } },
                    { "toUser.name": { $regex: search, $options: "i" } },
                    { "toUser.email": { $regex: search, $options: "i" } }
                ]
            }
        }] : []),

        {
            $project: {
                _id: 1,
                amount: 1,
                type: 1,
                // fee: 1,
                // agentCommission: 1,
                status: 1,
                createdAt: 1,
                from: "$fromUser._id",
                fromName: "$fromUser.name",
                fromEmail: "$fromUser.email",
                fromRole: "$fromUser.role",
                to: "$toUser._id",
                toName: "$toUser.name",
                toEmail: "$toUser.email",
                toRole: "$toUser.role",
                counterpartName: {
                    $cond: [{ $eq: ["$fromUser._id", objectId] }, "$toUser.name", "$fromUser.name"]
                },
                counterpartPhone: {
                    $cond: [{ $eq: ["$fromUser._id", objectId] }, "$toUser.phoneNumber", "$fromUser.phoneNumber"]
                },
                counterpartRole: {
                    $cond: {
                        if: { $eq: ["$fromUser._id", objectId] },
                        then: "$toUser.role",
                        else: "$fromUser.role"
                    }
                },
                direction: {
                    $cond: {
                        if: { $eq: ["$fromUser._id", objectId] },
                        then: "SENT",
                        else: "RECEIVED"
                    }
                }
            }
        }
    ];

    //  meta
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Transaction.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Sorting / pagination
    pipeline.push({ $sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const transactions = await Transaction.aggregate(pipeline);


    const sentTransactions = transactions.filter(tx => tx.from.toString() === userId);
    const receivedTransactions = transactions.filter(tx => tx.to.toString() === userId);

    const totalSent = sentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalReceived = receivedTransactions.reduce((sum, tx) => sum + tx.amount, 0);


    const sentByRole = sentTransactions.reduce((acc, tx) => {
        const role = tx.toRole;
        acc[role] = (acc[role] || 0) + tx.amount;
        return acc;
    }, {} as Record<string, number>);

    const receivedByRole = receivedTransactions.reduce((acc, tx) => {
        const role = tx.fromRole;
        acc[role] = (acc[role] || 0) + tx.amount;
        return acc;
    }, {} as Record<string, number>);

    return {
        user: {
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            // role: user.role
        },
        wallet: {
            balance: wallet?.balance || 0,
            totalSent,
            totalReceived,
            sentByRole,
            receivedByRole
        },
        transactions,
        meta: {
            currentPage: page,
            totalPages,
            totalCount,
            limit
        }
    };
};


export const UserService = {
    createUser,
    myProfile,
    blockUser,
    unblockUser,
    getUser,
    getUserStats,
    updateUser
}