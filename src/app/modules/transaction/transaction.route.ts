import { Router } from "express"
import { transactionController } from "./transaction.controller";
import { checkAuth } from "../../middlewares/chechAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { addMoneyZodSchema, sendMoneyZodSchema, withdrawMoneyZodSchema, } from "./transaction.validation";

const router = Router();

router.post(
    "/add-money",
    checkAuth(Role.USER),
    validateRequest(addMoneyZodSchema),
    transactionController.addMoney
)
router.post(
    "/withdraw",
    checkAuth(Role.USER),
    validateRequest(withdrawMoneyZodSchema),
    transactionController.withdrawMoney
)
router.post(
    "/send-money",
    checkAuth(Role.USER),
    validateRequest(sendMoneyZodSchema),
    transactionController.sendMoney
)
router.get(
    "/my",
    checkAuth(Role.USER, Role.AGENT),
    transactionController.getMyTransactionHistory
)


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


// router.post(
//     "/all-transactions",
//     checkAuth(Role.ADMIN),
// )



export const transactionRouter = router