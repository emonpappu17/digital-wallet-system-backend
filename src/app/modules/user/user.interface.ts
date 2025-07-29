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
    phoneNumber: string,
    password: string,
    role: Role,
    status: Status
}