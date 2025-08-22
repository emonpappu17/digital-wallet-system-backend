import { z } from "zod";

export const agentRequestZodSchema = z.object({
    name: z
        .string()
        .min(2, { message: "Name must be at least 2 characters long." })
        .max(100, { message: "Name cannot exceed 100 characters." }),
    email: z.email("Invalid email"),
    phoneNumber: z
        .string()
        .nonempty("Phone number is required")
        .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
            message:
                "Phone must be Bangladeshi format: +8801XXXXXXXXX or 01XXXXXXXXX",
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

    shopName: z.string().or(z.literal("")),
    nidNumber: z.string().optional().or(z.literal("")),
})
// export const agentRequestZodSchema = z.object({
//     name: z
//         .string()
//         .nonempty("Name is required"),
//     phoneNumber: z
//         .string()
//         .nonempty('Phone number is required')
//         .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
//             message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
//         }),
//     password: z
//         .string()
//         .nonempty("Phone number is required")

//         .min(8, { message: "Password must be at least 8 characters long." })
//         .regex(/^(?=.*[A-Z])/, {
//             message: "Password must contain at least 1 uppercase letter.",
//         })
//         .regex(/^(?=.*[!@#$%^&*])/, {
//             message: "Password must contain at least 1 special character.",
//         })
//         .regex(/^(?=.*\d)/, {
//             message: "Password must contain at least 1 number.",
//         }),
//     tradeLicenseNumber: z.string(),
//     address: z.string().optional(),
// })