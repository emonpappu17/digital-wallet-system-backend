import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { Role, Status } from "../user/user.interface";
import { User } from "../user/user.model";
import { Wallet } from "../wallet.ts/wallet.model";
import { AgentRequestStatus, IAgentRequest } from "./agentRequest.interface"
import { AgentRequest } from "./agentRequest.model";
import bcrypt from 'bcrypt';
import httpStatus from "http-status-codes"


const createAgentRequest = async (payload: Partial<IAgentRequest>) => {
    const { phoneNumber, password, email, ...rest } = payload;

    // console.log({ payload });

    // const isUserExist = await User.findOne({ phoneNumber })
    const isUserExist = await User.findOne({
        $or: [{ phoneNumber }, { email }]
    })

    // console.log({ isUserExist });
    if (isUserExist?.role === Role.USER) throw new AppError(httpStatus.BAD_REQUEST, "This credentials have User account, can not send Agent request")
    if (isUserExist?.role === Role.AGENT) throw new AppError(httpStatus.BAD_REQUEST, "You are already Agent!")

    const isAgentExist = await AgentRequest.findOne({
        $or: [{ phoneNumber }, { email }]
    })

    if (isAgentExist) throw new AppError(httpStatus.BAD_REQUEST, "You have already requested to become Agent!!")

    const hashedPassword = await bcrypt.hash(password as string, Number(envVars.BCRYPT_SALT_ROUND))

    const agentRequest = await AgentRequest.create({
        phoneNumber,
        password: hashedPassword,
        email,
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

    if (user?.status === AgentRequestStatus.SUSPEND as string) {
        const request = await User.findByIdAndUpdate(id, { status: AgentRequestStatus.APPROVED }, { new: true })
        return request
    }

    // const agentReq = await AgentRequest.findById(id);

    // const isUserExist = await User.findOne({
    //     $or: [{ phoneNumber: agentReq?.phoneNumber }, { email: agentReq?.email }]
    // })


    const request = await AgentRequest.findByIdAndUpdate(id, { status: AgentRequestStatus.APPROVED })

    if (!request) throw new AppError(httpStatus.NOT_FOUND, "Request not found")

    if (request.status === AgentRequestStatus.APPROVED) throw new AppError(httpStatus.BAD_REQUEST, "User are already approved to Agent")

    const agentUser = await User.create({
        name: request.name,
        email: request.email,
        shopName: request.shopName,
        nidNumber: request.nidNumber,
        phoneNumber: request.phoneNumber,
        password: request.password,
        role: Role.AGENT,
    })

    await Wallet.create({
        user: agentUser._id,
        balance: 50
    })

    const { password, ...rest } = agentUser.toObject();

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