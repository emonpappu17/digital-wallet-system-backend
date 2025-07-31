import { z } from 'zod';

export const registerUserZodSchema = z.object({
    name: z
        .string()
        .nonempty("Name is required"),
    phoneNumber: z
        .string()
        .nonempty('Phone number is required')
        .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
            message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
        }),
    password: z
        .string()
        .nonempty("Phone number is required")
        // .min(6, 'PIN must be at least 6 digits')
        // .max(12, 'PIN can’t exceed 12 digits'),
        .min(8, { message: "Password must be at least 8 characters long." })
        .regex(/^(?=.*[A-Z])/, {
            message: "Password must contain at least 1 uppercase letter.",
        })
        .regex(/^(?=.*[!@#$%^&*])/, {
            message: "Password must contain at least 1 special character.",
        })
        .regex(/^(?=.*\d)/, {
            message: "Password must contain at least 1 number.",
        }),
});


