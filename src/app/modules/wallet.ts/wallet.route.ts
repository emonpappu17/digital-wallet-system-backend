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

// router.patch(
//     "/wallets/:id/block",
//     checkAuth(Role.ADMIN),
//     walletController.blockWallet
// );
// router.patch(
//     "/wallets/:id/unblock",
//     checkAuth(Role.ADMIN),
//     walletController.unblockWallet
// );


// use query builder
router.get(
    '/my',
    checkAuth(Role.USER, Role.AGENT),
    walletController.myWallet
)

export const walletRoutes = router;