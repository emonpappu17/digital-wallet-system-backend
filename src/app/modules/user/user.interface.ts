export enum Role {
    USER = "USER",
    AGENT = "AGENT",
    ADMIN = "ADMIN"
}

export enum Status {
    ACTIVE = "ACTIVE",
    BLOCKED = "BLOCKED"
}

export interface IUser {
    name: string,
    email: string,
    phoneNumber: string,
    pin: string,
    role: Role,
    status: Status
}