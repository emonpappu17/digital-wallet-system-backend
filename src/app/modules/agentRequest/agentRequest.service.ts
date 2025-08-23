import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
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

    // const agentReq = await AgentRequest.findById(id);

    // const isUserExist = await User.findOne({
    //     $or: [{ phoneNumber: agentReq?.phoneNumber }, { email: agentReq?.email }]
    // })


    // const request = await AgentRequest.findByIdAndUpdate(id, { status: AgentRequestStatus.ACTIVE })

    // if (!request) throw new AppError(httpStatus.NOT_FOUND, "Request not found")

    if (user?.status === Status.ACTIVE) throw new AppError(httpStatus.BAD_REQUEST, "User are already approved to Agent")

    const agentUser = await User.findByIdAndUpdate(id, { status: Status.ACTIVE }, { new: true })

    if (!agentUser) throw new AppError(httpStatus.NOT_FOUND, "Request not found")

    // const agentUser = await User.create({

    //     role: Role.AGENT,
    // })

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

export const agentRequestService = {
    createAgentRequest,
    approveAgentRequest,
    getAllAgentRequests,
    suspendAgent
}