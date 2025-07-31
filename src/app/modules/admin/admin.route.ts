import { Router } from "express"
import { checkAuth } from "../../middlewares/chechAuth";
import { Role } from "../user/user.interface";
import { adminController } from "./admin.controller";

const router = Router();

router.get(
    "/users",
    checkAuth(Role.ADMIN),
    adminController.getAllUsers
);

router.get(
    "/agents",
    checkAuth(Role.ADMIN),
    adminController.getAllAgents
);

router.get("/wallets",
    checkAuth(Role.ADMIN),
    adminController.getAllWallets
);

router.get(
    "/transactions",
    checkAuth(Role.ADMIN),
    adminController.getAllTransactions
);


export const adminRoutes = router