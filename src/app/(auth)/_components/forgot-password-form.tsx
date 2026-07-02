"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ResetRequestFormState } from "@/lib/auth/schemas";

type Action = (
  state: ResetRequestFormState,
  formData: FormData,
) => Promise<ResetRequestFormState>;

export function ForgotPasswordForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState<
    ResetRequestFormState,
    FormData
  >(action, undefined);

  if (state?.submitted) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Check your inbox
        </h1>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          If an account exists for{" "}
          <span className="font-medium text-zinc-950 dark:text-zinc-50">
            {state.values?.email}
          </span>
          , we&apos;ve sent a reset link. The link expires in 15 minutes.
        </p>
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Heads up: resetting your password permanently deletes your encrypted
          journal entries. We can&apos;t recover them once the reset is
          confirmed.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <Link
            href="/sign-in"
            className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Reset your password
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Enter the email you signed up with. We&apos;ll send a one-time reset
          link.
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
          htmlFor="email"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          required
          defaultValue={state?.values?.email ?? ""}
          className="block min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        />
        {state?.errors?.email && (
          <p className="text-xs text-red-700 dark:text-red-300">
            {state.errors.email.join(" ")}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-zinc-950 px-3 text-sm font-medium text-zinc-50 shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Remembered it?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
