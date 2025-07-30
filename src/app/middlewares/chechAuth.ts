import e, { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { envVars } from "../config/env";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../modules/user/user.model";
import { Status } from "../modules/user/user.interface";


export const checkAuth = (...authRoles: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.headers.authorization;

        if (!accessToken) throw new Error("No Token Received")

        const verifiedToken = verifyToken(accessToken, envVars.JWT_ACCESS_SECRET) as JwtPayload;

        const isUserExist = await User.findOne({ phoneNumber: verifiedToken.phoneNumber })

        if (!isUserExist) throw new Error("User doest not exist")

        if (isUserExist.status === Status.BLOCKED) throw new Error("User is Blocked")

        if (!authRoles.includes(verifiedToken.role)) {
            throw new Error("You are not permitted to view this route!!")
        }

        req.user = verifiedToken;

        next();

    } catch (error) {
        next(error)
    }
}