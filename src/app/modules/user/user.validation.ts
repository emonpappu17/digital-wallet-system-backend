import { z } from 'zod';
export const registerUserZodSchema = z.object({
    name: z
        .string()
        .min(2, { message: "Name must be at least 2 characters long." })
        .max(100, { message: "Name cannot exceed 100 characters." }),
    email: z.email("Invalid email"),
    phoneNumber: z
        .string()
        .nonempty("Phone number is required")

        .regex(/^01\d{9}$/, {
            message: "Phone must be Bangladeshi format: 01XXXXXXXXX",
        }),

    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long." })
        .regex(/(?=.*[A-Z])/, {
            message: "Password must contain at least 1 uppercase letter.",
        })
        .regex(/(?=.*[!@#$%^&*])/, {
            message: "Password must contain at least 1 special character.",
        })
        .regex(/(?=.*\d)/, { message: "Password must contain at least 1 number." }),
})
export const updateUserZodSchema = z.object({
    name: z
        .string()
        .min(2, { message: "Name must be at least 2 characters long." })
        .max(100, { message: "Name cannot exceed 100 characters." }).optional(),
    // email: z.email("Invalid email"),
    newName: z
        .string()
        .min(2, { message: "Name must be at least 2 characters long." })
        .max(100, { message: "Name cannot exceed 100 characters." }).optional(),
    // email: z.email("Invalid email"),
    phoneNumber: z
        .string()
        .nonempty("Phone number is required")
        .regex(/^01\d{9}$/, {
            message: "Phone must be Bangladeshi format: 01XXXXXXXXX",
        }).optional(),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long." })
        .regex(/(?=.*[A-Z])/, {
            message: "Password must contain at least 1 uppercase letter.",
        })
        .regex(/(?=.*[!@#$%^&*])/, {
            message: "Password must contain at least 1 special character.",
        })
        .regex(/(?=.*\d)/, { message: "Password must contain at least 1 number." }).optional(),
    oldPassword: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long." })
        .regex(/(?=.*[A-Z])/, {
            message: "Password must contain at least 1 uppercase letter.",
        })
        .regex(/(?=.*[!@#$%^&*])/, {
            message: "Password must contain at least 1 special character.",
        })
        .regex(/(?=.*\d)/, { message: "Password must contain at least 1 number." }).optional(),
})