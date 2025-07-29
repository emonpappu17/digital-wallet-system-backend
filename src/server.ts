import { Server } from "http";
import app from "./app";
import { envVars } from "./app/config/env";
import mongoose from "mongoose";


let server: Server;

const startServer = async () => {
    try {
        await mongoose.connect(envVars.DB_URL)
        console.log("Mongoose connected successfully!");
        server = app.listen(envVars.PORT, () => {
            console.log("Server is listing on port 4000");
        })
    } catch (error) {
        console.log(error);
    }
}

startServer();