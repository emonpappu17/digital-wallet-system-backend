import { NextFunction, Request, Response } from "express"
import { envVars } from "../config/env";


export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

    console.log(err);

    let statusCode = 500;
    let message = err.message || 'Something went wrong!!'
    res.status(statusCode).json({
        success: false,
        message,
        // errorSources,
        err: envVars.NODE_ENV === "development" ? err : null,
        stack: envVars.NODE_ENV === "development" ? err.stack : null
    })
}