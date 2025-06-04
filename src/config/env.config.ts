/// <reference types="vite/client" />
import { z } from 'zod';

const envSchema = z.object({
    VITE_BACKEND_URL: z.string().default('http://localhost:3000'),
    VITE_GOOGLE_CLIENT_ID: z.string().min(1, 'VITE_GOOGLE_CLIENT_ID is required.'),
    VITE_IMGBB_API_KEY: z.string().optional(),
});

const parseEnv = () => {
    const result = envSchema.safeParse(import.meta.env);

    if (!result.success) {
        const formatted = result.error.errors
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join('\n');
        throw new Error(`Config validation error:\n${formatted}`);
    }

    return result.data;
};

const env = parseEnv();

const config = {
    BACKEND_URL: env.VITE_BACKEND_URL,
    GOOGLE_CLIENT_ID: env.VITE_GOOGLE_CLIENT_ID,
    IMGBB_API_KEY: env.VITE_IMGBB_API_KEY || '',
};

export default config;
