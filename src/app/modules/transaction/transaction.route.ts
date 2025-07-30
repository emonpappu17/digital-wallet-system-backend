import { Router } from "express"
import { transactionController } from "./transaction.controller";
import { checkAuth } from "../../middlewares/chechAuth";
import { Role } from "../user/user.interface";

const router = Router();


router.post(
    "/cash-in",
    checkAuth(Role.AGENT),
    transactionController.cashIn
)

router.post(
    "/cash-out",
    checkAuth(Role.USER),
    transactionController.cashOut
)



export const transactionRouter = router