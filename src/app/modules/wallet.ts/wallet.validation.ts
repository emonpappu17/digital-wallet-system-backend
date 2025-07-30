import { z } from "zod";


export const fundAgentWalletZodSchema = z.object({
    agentId: z.string(),
    amount: z.number().positive()
})