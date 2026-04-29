"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthFormState } from "@/lib/auth/schemas";

type AuthAction = (
  state: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

type Props = {
  mode: "sign-in" | "sign-up";
  action: AuthAction;
};

const COPY = {
  "sign-in": {
    title: "Sign in",
    submit: "Sign in",
    hint: "No account yet?",
    altLink: "/sign-up",
    altLabel: "Create one",
    passwordHelp: undefined,
    autoComplete: "current-password" as const,
  },
  "sign-up": {
    title: "Create your account",
    submit: "Create account",
    hint: "Already have an account?",
    altLink: "/sign-in",
    altLabel: "Sign in",
    passwordHelp: "At least 12 characters.",
    autoComplete: "new-password" as const,
  },
} as const;

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    undefined,
  );
  const copy = COPY[mode];

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {copy.title}
        </h1>
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
          autoComplete="email"
          required
          defaultValue={state?.values?.email ?? ""}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        />
        {state?.errors?.email && (
          <p className="text-xs text-red-700 dark:text-red-300">
            {state.errors.email.join(" ")}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={copy.autoComplete}
          required
          minLength={mode === "sign-up" ? 12 : 1}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        />
        {copy.passwordHelp && !state?.errors?.password && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {copy.passwordHelp}
          </p>
        )}
        {state?.errors?.password && (
          <p className="text-xs text-red-700 dark:text-red-300">
            {state.errors.password.join(" ")}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-50 shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {pending ? "Working…" : copy.submit}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {copy.hint}{" "}
        <Link
          href={copy.altLink}
          className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          {copy.altLabel}
        </Link>
      </p>
    </form>
  );
}
