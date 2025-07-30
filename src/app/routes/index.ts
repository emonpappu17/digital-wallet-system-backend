import { Router } from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoutes } from "../modules/auth/auth.route";
import { agentRequestRoutes } from "../modules/agentRequest/agentRequest.route";


export const router = Router();

const moduleRouts = [
    {
        path: "/user",
        route: userRoutes
    },
    {
        path: "/auth",
        route: authRoutes
    },
    {
        path: "/agent-requests",
        route: agentRequestRoutes
    }
]

moduleRouts.forEach((route) => {
    router.use(route.path, route.route)
})