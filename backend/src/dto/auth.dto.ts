import { z } from 'zod';

export const loginDto = z.object({
    loginOrEmail: z
        .string({ required_error: 'Login is required.' })
        .min(4, { message: 'Login must be at least 4 characters long.' })
        .max(20, { message: 'Login must be at most 20 characters long.' }),
    password: z
        .string({ required_error: 'Password is required.' })
        .min(8, { message: 'Password must be at least 8 characters long.' }),
});
