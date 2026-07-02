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

export const ResetRequestSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
});

export const ResetConfirmSchema = z.object({
  token: z.string().min(1, "Reset token is missing").max(512),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(256, "Password is too long"),
  // The UI requires the user to type "I understand" verbatim before we
  // delete their entries. We re-check it on the server.
  confirmation: z
    .string()
    .refine((v) => v.trim().toLowerCase() === "i understand", {
      message: "Type 'I understand' to confirm",
    }),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type ResetRequestInput = z.infer<typeof ResetRequestSchema>;
export type ResetConfirmInput = z.infer<typeof ResetConfirmSchema>;

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

export type ResetRequestFormState =
  | {
      errors?: { email?: string[]; form?: string[] };
      values?: { email?: string };
      submitted?: boolean;
    }
  | undefined;

export type ResetConfirmFormState =
  | {
      errors?: {
        password?: string[];
        confirmation?: string[];
        token?: string[];
        form?: string[];
      };
      // On success, kdfSalt+redirectTo lets the client unlock the freshly-reset
      // account in the same session, just like sign-in/sign-up.
      kdfSalt?: string;
      redirectTo?: string;
    }
  | undefined;
