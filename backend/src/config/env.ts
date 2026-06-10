import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    PORT: z.coerce.number().default(4000),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    XAI_API_KEY: z.string().optional(),
    XAI_MODEL: z.string().default("grok-4.3"),
});

export const env = envSchema.parse(process.env);