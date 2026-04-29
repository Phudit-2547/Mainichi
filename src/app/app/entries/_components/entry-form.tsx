"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { EntryFormState } from "@/lib/entries/schemas";

type EntryAction = (
  state: EntryFormState,
  formData: FormData,
) => Promise<EntryFormState>;

type Props = {
  action: EntryAction;
  submitLabel: string;
  initial?: { title?: string; body?: string };
  cancelHref: string;
};

export function EntryForm({ action, submitLabel, initial, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState<EntryFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5">
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
          htmlFor="title"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          autoComplete="off"
          defaultValue={state?.values?.title ?? initial?.title ?? ""}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        />
        {state?.errors?.title && (
          <p className="text-xs text-red-700 dark:text-red-300">
            {state.errors.title.join(" ")}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="body"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Body
          <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
            Markdown
          </span>
        </label>
        <textarea
          id="body"
          name="body"
          rows={14}
          maxLength={100_000}
          defaultValue={state?.values?.body ?? initial?.body ?? ""}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm leading-relaxed text-zinc-950 outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        />
        {state?.errors?.body && (
          <p className="text-xs text-red-700 dark:text-red-300">
            {state.errors.body.join(" ")}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-50 shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
