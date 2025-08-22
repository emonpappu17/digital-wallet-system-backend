import express, { Application, Request, Response } from "express"
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler"
import notFound from "./app/middlewares/notFound"
import { router } from "./app/routes"
import path from "path"
import cookieParser from "cookie-parser";
import cors from "cors"
import { envVars } from "./app/config/env"


const app: Application = express()

app.use(cookieParser())
app.use(express.json())
app.use(cors({
    origin: envVars.FRONTEND_URL,
    credentials: true
}))

app.use("/api/v1", router)

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public/index.html"))
    // res.status(200).json({
    //     message: "Welcome to Digital Wallet System Backend"
    // })
})

app.use(globalErrorHandler)

app.use(notFound)

export default app;