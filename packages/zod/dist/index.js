"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignupValidation = void 0;
const zod_1 = require("zod");
exports.SignupValidation = zod_1.z.object({
    name: zod_1.z.string().min(3).max(20),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().regex(/^(\+91[\-\s]?)?[6-9]\d{9}$/, {
        message: "Invalid Indian phone number",
    }),
    password: zod_1.z.string().min(6).max(10)
});
