export enum Role {
    USER = "USER",
    AGENT = "AGENT",
    ADMIN = "ADMIN"
}

export enum Status {
    ACTIVE = "ACTIVE",
    BLOCKED = "BLOCKED",
    PENDING = "PENDING",
    // REJECTED = "REJECTED",
    SUSPEND = "SUSPEND"
}

export interface IUser {
    name: string,
    phoneNumber: string,
    email: string,
    password: string,
    role: Role,
    photo?: string,
    status: Status
    nidNumber?: string,
    shopName?: string,
}