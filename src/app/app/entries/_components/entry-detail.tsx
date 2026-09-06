"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCrypto } from "@/lib/crypto/context";
import { deleteEntryAction } from "@/lib/entries/actions";
import { formatDateTime } from "./format";
import type { Entry } from "@/lib/db/schema/entries";

type Props = { entry: Entry };

export function EntryDetail({ entry }: Props) {
  const { decryptText } = useCrypto();
  const [decrypted, setDecrypted] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    Promise.all([decryptText(entry.title), decryptText(entry.body)]).then(
      ([title, body]) => setDecrypted({ title, body }),
    );
  }, [entry.id, decryptText]); // eslint-disable-line react-hooks/exhaustive-deps

  const title = entry.journalDate ?? decrypted?.title ?? "•••";
  const body = decrypted?.body ?? "";
  const editHref = entry.journalDate
    ? `/app/journal/${entry.journalDate}`
    : `/app/entries/${entry.id}/edit`;

  return (
    <article className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          <time dateTime={entry.createdAt.toISOString()}>
            {formatDateTime(entry.createdAt)}
          </time>
          {entry.updatedAt.getTime() !== entry.createdAt.getTime() && (
            <span className="ml-2 normal-case tracking-normal text-zinc-400 dark:text-zinc-500">
              · updated {formatDateTime(entry.updatedAt)}
            </span>
          )}
        </p>
        <h1 className="break-words text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href={editHref}
            className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            {entry.journalDate ? "Open daily editor" : "Edit"}
          </Link>
          <form action={deleteEntryAction}>
            <input type="hidden" name="entryId" value={entry.id} />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-md border border-red-300 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-950"
            >
              Delete
            </button>
          </form>
          <Link
            href="/app/entries"
            className="-m-2 inline-flex min-h-11 items-center p-2 text-sm text-zinc-600 underline-offset-4 hover:underline sm:ml-auto dark:text-zinc-400"
          >
            Back
          </Link>
        </div>
      </header>

      <div className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        {decrypted ? (
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-zinc-900 dark:text-zinc-100">
            {body}
          </pre>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Decrypting…</p>
        )}
      </div>
    </article>
  );
}
