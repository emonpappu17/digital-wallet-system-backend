import express, { Application, Request, Response, NextFunction } from "express"
import { router } from "./app/routes"
import { envVars } from "./app/config/env"
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler"
import notFound from "./app/middlewares/notFound"

const app: Application = express()

app.use(express.json())

app.use("/api/v1", router)

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome to Digital Wallet System Backend"
    })
})

app.use(globalErrorHandler)

app.use(notFound)

export default app;