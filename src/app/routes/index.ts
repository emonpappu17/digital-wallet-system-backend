import { Router } from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoutes } from "../modules/auth/auth.route";
import { agentRequestRoutes } from "../modules/agentRequest/agentRequest.route";
import { walletRoutes } from "../modules/wallet.ts/wallet.route";
import { transactionRouter } from "../modules/transaction/transaction.route";
import { adminRoutes } from "../modules/admin/admin.route";


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
        path: "/admin",
        route: adminRoutes
    },
    {
        path: "/wallet",
        route: walletRoutes
    },
    {
        path: "/agent-requests",
        route: agentRequestRoutes
    },
    {
        path: "/transactions",
        route: transactionRouter
    }
]

moduleRouts.forEach((route) => {
    router.use(route.path, route.route)
})