"use server";

import { and, eq, isNull, gte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  entries,
  passwordResetTokens,
  sessions,
  users,
} from "@/lib/db/schema";
import { appUrl, emailProvider, passwordResetEmail } from "@/lib/email";
import { generateKdfSalt, hashPassword } from "./password";
import {
  RESET_TOKEN_TTL_MINUTES,
  generateResetToken,
  hashResetToken,
  resetTokenExpiry,
} from "./reset-token";
import {
  ResetConfirmSchema,
  ResetRequestSchema,
  type ResetConfirmFormState,
  type ResetRequestFormState,
} from "./schemas";
import { destroySession } from "./session";

export async function requestPasswordResetAction(
  _state: ResetRequestFormState,
  formData: FormData,
): Promise<ResetRequestFormState> {
  const parsed = ResetRequestSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return {
      errors: { email: parsed.error.flatten().fieldErrors.email },
      values: { email: String(formData.get("email") ?? "") },
    };
  }
  const { email } = parsed.data;

  // Always present a success state to the user — never leak whether the
  // email matches an account. Failures during issuance are logged but the
  // response shape doesn't change.
  try {
    await issueResetToken(email);
  } catch (err) {
    console.error("password reset issuance failed", err);
  }

  return { submitted: true, values: { email } };
}

async function issueResetToken(email: string): Promise<void> {
  const [user] = await db()
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) return; // silently no-op for unknown emails

  const { raw, hash } = generateResetToken();
  const expiresAt = resetTokenExpiry();

  await db().insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: hash,
    expiresAt,
  });

  const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(raw)}`;
  const message = passwordResetEmail({
    to: user.email,
    resetUrl,
    expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
  });
  await emailProvider().send(message);
}

export type VerifyTokenResult =
  | { ok: true }
  | { ok: false; reason: "missing" | "invalid" | "expired" | "used" };

export async function verifyResetToken(
  raw: string,
): Promise<VerifyTokenResult> {
  if (!raw) return { ok: false, reason: "missing" };
  const hash = hashResetToken(raw);
  const [row] = await db()
    .select({
      id: passwordResetTokens.id,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
    })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, hash))
    .limit(1);
  if (!row) return { ok: false, reason: "invalid" };
  if (row.usedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true };
}

export async function confirmPasswordResetAction(
  _state: ResetConfirmFormState,
  formData: FormData,
): Promise<ResetConfirmFormState> {
  const parsed = ResetConfirmSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        token: flat.token,
        password: flat.password,
        confirmation: flat.confirmation,
      },
    };
  }
  const { token, password } = parsed.data;
  const hash = hashResetToken(token);

  // Look up under a freshness filter so a stolen-but-expired token can't
  // be claimed even by racing with cleanup.
  const now = new Date();
  const [tokenRow] = await db()
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
    })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hash),
        isNull(passwordResetTokens.usedAt),
        gte(passwordResetTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!tokenRow) {
    return {
      errors: {
        form: [
          "This reset link is invalid or has expired. Request a new one to continue.",
        ],
      },
    };
  }

  const newPasswordHash = await hashPassword(password);
  const newKdfSalt = generateKdfSalt();

  // Mark the token used first. If anything fails after this point, the
  // token is still consumed — single-use semantics override convenience.
  const used = await db()
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(passwordResetTokens.id, tokenRow.id),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .returning({ id: passwordResetTokens.id });
  if (used.length === 0) {
    // Lost the race — someone else just consumed this token.
    return {
      errors: {
        form: [
          "This reset link was just used. Request a new one if you still need to reset.",
        ],
      },
    };
  }

  // Rotate credentials + KDF salt, drop all encrypted entries (option (a)
  // E2E impact, see plan), invalidate every existing session.
  await db()
    .update(users)
    .set({ passwordHash: newPasswordHash, kdfSalt: newKdfSalt })
    .where(eq(users.id, tokenRow.userId));
  await db().delete(entries).where(eq(entries.userId, tokenRow.userId));
  await db().delete(sessions).where(eq(sessions.userId, tokenRow.userId));

  // Burn any other still-unused reset tokens for this user so a leaked-but-
  // unused token can't be replayed against the freshly-reset account.
  await db()
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(passwordResetTokens.userId, tokenRow.userId),
        isNull(passwordResetTokens.usedAt),
      ),
    );

  // Drop the caller's own cookie too, since the row it referenced is gone.
  await destroySession();

  // We don't auto-sign-in after reset. Force a fresh sign-in on the cleaned
  // account so the user proves possession of the new password before we
  // re-derive a key. The kdfSalt isn't returned here — the sign-in flow
  // returns it on the next login.
  return { redirectTo: "/sign-in?reset=ok" };
}
