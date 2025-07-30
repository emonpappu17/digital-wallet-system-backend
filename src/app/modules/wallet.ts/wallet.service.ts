import { Role, Status } from "../user/user.interface";
import { User } from "../user/user.model";
import { IWallet } from "./wallet.interface"
import { Wallet } from "./wallet.model";

interface IFund {
    agentId: string,
    amount: number
}

const fundAgentWallet = async (payload: IFund) => {
    const { agentId, amount } = payload;

    const user = await User.findById(agentId);

    if (!user || user.role !== Role.AGENT) {
        throw new Error("Invalid agent ID")
    }

    const wallet = await Wallet.findOne({ user: agentId });

    if (!wallet) throw new Error("Agent wallet not found")

    wallet.balance += amount;

    await wallet.save();
}

export const walletService = {
    fundAgentWallet
}