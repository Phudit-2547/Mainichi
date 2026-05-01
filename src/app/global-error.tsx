"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="max-w-sm space-y-4 px-4 text-center">
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Something went wrong
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            A server error occurred. If this keeps happening, check that the
            server environment is configured correctly.
          </p>
          <button
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
