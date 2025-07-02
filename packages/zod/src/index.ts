import { z } from "zod"

export const SignupValidation = z.object({
    name: z.string().min(3).max(20),
    email: z.string().email(),
    phone: z.string().regex(/^(\+91[\-\s]?)?[6-9]\d{9}$/, {
        message: "Invalid Indian phone number",
    }),
    password:z.string().min(6).max(10)
})