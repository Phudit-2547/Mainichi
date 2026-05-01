import { z } from "zod";

export const SignUpSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(256, "Password is too long"),
});

export const SignInSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Password is required").max(256),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;

export type AuthFormState =
  | {
      errors?: { email?: string[]; password?: string[]; form?: string[] };
      values?: { email?: string };
      // Present on successful auth; client uses this to derive the E2E key.
      // kdfSalt is not secret (it is a random per-user salt, not the key itself).
      kdfSalt?: string;
      redirectTo?: string;
    }
  | undefined;
