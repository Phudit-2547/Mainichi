import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (postgres connection string)"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 chars (use `openssl rand -hex 32`)"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_URL: z.string().url().optional(),
  EMAIL_PROVIDER: z.enum(["resend", "smtp", "log"]).default("log"),
  EMAIL_FROM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === "true" || v === "1"),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
