import { z } from "zod";


export const fundAgentWalletZodSchema = z.object({
    agentNumber: z
        .string()
        .nonempty('Phone number is required')
        .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
            message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
        }),
    amount: z.number().positive()
})