"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { ResetConfirmFormState } from "@/lib/auth/schemas";

type Action = (
  state: ResetConfirmFormState,
  formData: FormData,
) => Promise<ResetConfirmFormState>;

export function ResetPasswordForm({
  token,
  action,
}: {
  token: string;
  action: Action;
}) {
  const [state, formAction, pending] = useActionState<
    ResetConfirmFormState,
    FormData
  >(action, undefined);
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const confirmationOk = confirmation.trim().toLowerCase() === "i understand";

  useEffect(() => {
    if (state?.redirectTo) router.push(state.redirectTo);
  }, [state?.redirectTo, router]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Set a new password
        </h1>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        <p className="font-medium">
          This will permanently delete your encrypted journal entries.
        </p>
        <p className="mt-1">
          Mainichi derives the key that decrypts your entries from your
          password. We never see the key, so a password reset means we cannot
          decrypt your old entries — they will be removed when you confirm
          below. Sessions on every device will also be signed out.
        </p>
      </div>

      {state?.errors?.form && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {state.errors.form.join(" ")}
        </p>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className="block min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        />
        {state?.errors?.password ? (
          <p className="text-xs text-red-700 dark:text-red-300">
            {state.errors.password.join(" ")}
          </p>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            At least 12 characters.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="confirmation"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Type{" "}
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">
            I understand
          </span>{" "}
          to confirm
        </label>
        <input
          id="confirmation"
          name="confirmation"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className="block min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        />
        {state?.errors?.confirmation && (
          <p className="text-xs text-red-700 dark:text-red-300">
            {state.errors.confirmation.join(" ")}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || !confirmationOk}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-red-700 px-3 text-sm font-medium text-zinc-50 shadow-sm transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-700 dark:text-zinc-50 dark:hover:bg-red-600"
      >
        {pending
          ? "Resetting…"
          : "Reset password and delete entries"}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Changed your mind?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
