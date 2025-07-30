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

export const walletRoutes = router;