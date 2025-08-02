import { Server } from "http";
import app from "./app";
import { envVars } from "./app/config/env";
import mongoose from "mongoose";
import { createAdmin } from "./app/utils/createAdmin";


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

(async () => {
    await startServer();
    await createAdmin();
})()

process.on("SIGTERM", () => {
    console.log("SIGTERM signal recieved...  Server shutting down..");

    if (server) {
        server.close(() => {
            process.exit(1)
        })
    }

    process.exit(1)
})

process.on("SIGINT", () => {
    console.log("SIGINT signal recieved...  Server shutting down..");

    if (server) {
        server.close(() => {
            process.exit(1)
        })
    }

    process.exit(1)
})

process.on("unhandledRejection", (err) => {
    console.log("Unhandled Rejection detected...  Server shutting down..", err);

    if (server) {
        server.close(() => {
            process.exit(1)
        })
    }

    process.exit(1)
})

process.on("uncaughtException", (err) => {
    console.log("Unhandled Exception detected...  Server shutting down..", err);

    if (server) {
        server.close(() => {
            process.exit(1)
        })
    }

    process.exit(1)
})