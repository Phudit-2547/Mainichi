"use client";

import Link from "next/link";

export default function AuthError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="w-full max-w-sm space-y-4 text-center">
      <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
        Something went wrong
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        The server could not process your request. If this is a new deployment,
        make sure <code className="text-xs">DATABASE_URL</code> and{" "}
        <code className="text-xs">AUTH_SECRET</code> are configured.
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
