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

const approveAgentRequest = async (id: string) => {
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

export const agentRequestService = {
    createAgentRequest,
    approveAgentRequest
}