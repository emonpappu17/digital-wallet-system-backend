export enum AgentRequestStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export interface IAgentRequest {
    name: string,
    phoneNumber: string,
    password: string,
    tradeLicenseNumber: string,
    address: string,
    status: AgentRequestStatus
}