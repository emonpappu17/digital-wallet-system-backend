import { Router } from "express";
import { userRoutes } from "../modules/user/user.route";


export const router = Router();

const moduleRouts = [
    {
        path: "/user",
        route: userRoutes
    }
]

moduleRouts.forEach((route) => {
    router.use(route.path, route.route)
})