export enum AgentRequestStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    SUSPEND = "SUSPEND"
}

export interface IAgentRequest {
    name: string,
    phoneNumber: string,
    password: string,
    tradeLicenseNumber: string,
    address: string,
    status: AgentRequestStatus
}