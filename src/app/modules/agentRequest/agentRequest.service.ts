import { envVars } from "../../config/env";
import { Role, Status } from "../user/user.interface";
import { User } from "../user/user.model";
import { Wallet } from "../wallet.ts/wallet.model";
import { AgentRequestStatus, IAgentRequest } from "./agentRequest.interface"
import { AgentRequest } from "./agentRequest.model";
import bcrypt from 'bcrypt';


const createAgentRequest = async (payload: Partial<IAgentRequest>) => {
    const { phoneNumber, password, ...rest } = payload;

    const isUserExist = await User.findOne({ phoneNumber })

    if (isUserExist) throw new Error("You are already Agent!!")

    const isAgentExist = await AgentRequest.findOne({ phoneNumber })

    if (isAgentExist) throw new Error("You have already requested!!")

    const hashedPassword = await bcrypt.hash(password as string, Number(envVars.BCRYPT_SALT_ROUND))

    const agentRequest = await AgentRequest.create({
        phoneNumber,
        password: hashedPassword,
        ...rest
    })

    return agentRequest;
}

const getAllAgentRequests = async () => {
    const requests = await AgentRequest.find();

    if (!requests) throw new Error("No request found")

    return requests;
}

const approveAgentRequest = async (id: string) => {
    const user = await User.findById(id);

    if (user?.role === Role.USER || user?.role === Role.ADMIN) throw new Error("User or Admin cannot be approved!!")

    if (user?.status === AgentRequestStatus.SUSPEND as string) {
        const request = await User.findByIdAndUpdate(id, { status: AgentRequestStatus.APPROVED }, { new: true })
        return request
    }

    const request = await AgentRequest.findByIdAndUpdate(id, { status: AgentRequestStatus.APPROVED })

    if (!request) throw new Error("Request not found")

    if (request.status === AgentRequestStatus.APPROVED) throw new Error("User are already approved to Agent")

    const agentUser = await User.create({
        name: request.name,
        phoneNumber: request.phoneNumber,
        password: request.password,
        role: Role.AGENT,
    })

    await Wallet.create({
        user: agentUser._id,
        balance: 0
    })
}

const suspendAgent = async (id: string) => {
    const user = await User.findById(id);

    if (user?.role === Role.USER) throw new Error("User cannot be suspend!!")

    const admin = await User.findById(id);

    if (admin?.role === Role.ADMIN) throw new Error("Admin cannot be suspend!!")

    const agent = await User.findByIdAndUpdate(id, { status: AgentRequestStatus.SUSPEND }, { new: true })

    if (!agent || agent.role !== Role.AGENT) throw new Error("Agent not found")
    return agent;
}

export const agentRequestService = {
    createAgentRequest,
    approveAgentRequest,
    getAllAgentRequests,
    suspendAgent
}