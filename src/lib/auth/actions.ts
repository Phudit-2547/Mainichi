"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import {
  generateKdfSalt,
  hashPassword,
  verifyPassword,
} from "./password";
import { createSession, destroySession } from "./session";
import {
  SignInSchema,
  SignUpSchema,
  type AuthFormState,
} from "./schemas";

// Pre-computed dummy hash so missing-user lookups take the same time as
// real password verifications. Prevents user-enumeration via timing.
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$YWFhYWFhYWFhYWFhYWFhYQ$RdescudvJCsgt3ub+b+dWRWJTmaaJObG";

function kdfSaltToBase64url(salt: Buffer): string {
  return salt
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function signUpAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = SignUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      errors: { email: flat.email, password: flat.password },
      values: { email: String(formData.get("email") ?? "") },
    };
  }

  const { email, password } = parsed.data;

  const existing = await db()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return {
      errors: { form: ["An account with this email already exists."] },
      values: { email },
    };
  }

  const passwordHash = await hashPassword(password);
  const kdfSalt = generateKdfSalt();

  const [created] = await db()
    .insert(users)
    .values({ email, passwordHash, kdfSalt })
    .returning({ id: users.id });
  if (!created) {
    return {
      errors: { form: ["Could not create account. Please try again."] },
      values: { email },
    };
  }

  await createSession(created.id);
  // Return kdfSalt so the client can derive the E2E key immediately,
  // avoiding a second password prompt. The client navigates to redirectTo.
  return { kdfSalt: kdfSaltToBase64url(kdfSalt), redirectTo: "/app" };
}

export async function signInAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      errors: { email: flat.email, password: flat.password },
      values: { email: String(formData.get("email") ?? "") },
    };
  }

  const { email, password } = parsed.data;

  const [user] = await db()
    .select({ id: users.id, passwordHash: users.passwordHash, kdfSalt: users.kdfSalt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Constant-time-ish: always run verifyPassword, even when user is missing.
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : (await verifyPassword(password, DUMMY_HASH), false);

  if (!user || !ok) {
    return {
      errors: { form: ["Email or password is incorrect."] },
      values: { email },
    };
  }

  await createSession(user.id);
  // Return kdfSalt so the client can derive the E2E key immediately.
  return { kdfSalt: kdfSaltToBase64url(user.kdfSalt as Buffer), redirectTo: "/app" };
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
