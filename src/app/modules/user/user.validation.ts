import z from "zod"
export const registerUserZodSchema = z.object({
    name: z.
        string({ invalid_type_error: "Name must be string" })
        .min(2, { message: "Name must be at least 2 characters long." })
})