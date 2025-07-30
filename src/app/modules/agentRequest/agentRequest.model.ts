import { model, Schema } from "mongoose";
import { AgentRequestStatus, IAgentRequest } from "./agentRequest.interface";

const agentRequestSchema = new Schema<IAgentRequest>({
    name: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    password: {
        type: String
    },
    tradeLicenseNumber: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String
    },
    status: {
        type: String,
        enum: Object.values(AgentRequestStatus),
        default: AgentRequestStatus.PENDING
    }
},
    {
        timestamps: true,
        versionKey: false
    })

export const AgentRequest = model<IAgentRequest>("AgentRequest", agentRequestSchema)