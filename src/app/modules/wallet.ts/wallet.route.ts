import { Router } from "express";
import { checkAuth } from "../../middlewares/chechAuth";
import { Role } from "../user/user.interface";
import { walletController } from "./wallet.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { fundAgentWalletZodSchema } from "./wallet.validation";

const router = Router();

router.post(
    '/fund',
    checkAuth(Role.ADMIN),
    validateRequest(fundAgentWalletZodSchema),
    walletController.fundAgentWallet
)

// router.post(
//     '/block/:id',
//     checkAuth(Role.ADMIN),
// )

// router.post(
//     '/unblock/:id',
//     checkAuth(Role.ADMIN),
// )

// use query builder
// router.get(
//     '/my',
//     checkAuth(Role.USER, Role.AGENT),
// )

// router.get(
//     '/all-wallets',
//     checkAuth(Role.ADMIN),
// )



export const walletRoutes = router;