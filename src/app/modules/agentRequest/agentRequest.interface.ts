export enum AgentRequestStatus {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    REJECTED = "REJECTED",
    SUSPEND = "SUSPEND"
}

export interface IAgentRequest {
    name: string,
    email: string,
    phoneNumber: string,
    password: string,
    nidNumber: string,
    shopName: string,
    status: AgentRequestStatus
}