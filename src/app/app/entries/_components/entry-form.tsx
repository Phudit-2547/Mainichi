"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useCrypto } from "@/lib/crypto/context";
import type { EntryFormState } from "@/lib/entries/schemas";

type EntryAction = (
  state: EntryFormState,
  formData: FormData,
) => Promise<EntryFormState>;

type Props = {
  action: EntryAction;
  submitLabel: string;
  /** Ciphertext (or plaintext for legacy enc_v=0 entries) from the server */
  initial?: { title?: string; body?: string };
  cancelHref: string;
};

export function EntryForm({ action, submitLabel, initial, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState<EntryFormState, FormData>(
    action,
    undefined,
  );
  const { encryptText, decryptText } = useCrypto();
  const [, startTransition] = useTransition();

  // Decrypted initial values for edit mode
  const [decrypted, setDecrypted] = useState<{ title: string; body: string } | null>(
    initial ? null : { title: "", body: "" },
  );

  useEffect(() => {
    if (!initial) return;
    Promise.all([
      decryptText(initial.title ?? ""),
      decryptText(initial.body ?? ""),
    ]).then(([title, body]) => setDecrypted({ title, body }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const body = (form.elements.namedItem("body") as HTMLTextAreaElement).value;

    let encTitle: string;
    let encBody: string;
    try {
      [encTitle, encBody] = await Promise.all([
        encryptText(title),
        encryptText(body),
      ]);
    } catch {
      // encryptText throws if key is locked; CryptoGuard will handle re-unlock
      return;
    }

    const encryptedData = new FormData();
    encryptedData.set("title", encTitle);
    encryptedData.set("body", encBody);

    startTransition(() => {
      formAction(encryptedData);
    });
  };

  if (initial && !decrypted) {
    return (
      <div className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Decrypting…
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
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
          defaultValue={state?.values?.title ?? decrypted?.title ?? ""}
          key={decrypted?.title}
          className="block min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
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
          rows={10}
          maxLength={100_000}
          defaultValue={state?.values?.body ?? decrypted?.body ?? ""}
          key={decrypted?.body}
          className="block min-h-[60vh] w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-base leading-relaxed text-zinc-950 outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 sm:min-h-[20rem] sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        />
        {state?.errors?.body && (
          <p className="text-xs text-red-700 dark:text-red-300">
            {state.errors.body.join(" ")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-zinc-50 shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="-m-2 inline-flex min-h-11 items-center p-2 text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
