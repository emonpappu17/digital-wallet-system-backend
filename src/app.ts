import express, { Application, Request, Response } from "express"
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler"
import notFound from "./app/middlewares/notFound"
import { router } from "./app/routes"
import path from "path"

const app: Application = express()

app.use(express.json())

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