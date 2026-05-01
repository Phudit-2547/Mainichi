"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCrypto } from "@/lib/crypto/context";
import { formatDateTime } from "./format";
import type { EntrySummary } from "@/lib/entries/dal";

type Props = { entries: EntrySummary[] };

type DecryptedSummary = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export function EntriesList({ entries }: Props) {
  const { decryptText } = useCrypto();
  const [decrypted, setDecrypted] = useState<DecryptedSummary[] | null>(null);

  useEffect(() => {
    Promise.all(
      entries.map(async (e) => ({
        ...e,
        title: await decryptText(e.title),
      })),
    ).then(setDecrypted);
  }, [entries, decryptText]);

  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-white px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No entries yet. Start your journal with{" "}
          <Link
            href="/app/entries/new"
            className="font-medium text-zinc-950 underline underline-offset-4 dark:text-zinc-50"
          >
            your first entry
          </Link>
          .
        </p>
      </div>
    );
  }

  const rows = decrypted ?? entries.map((e) => ({ ...e, title: "•••" }));

  return (
    <ul className="divide-y divide-zinc-200 overflow-hidden rounded-md border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
      {rows.map((entry) => (
        <li key={entry.id}>
          <Link
            href={`/app/entries/${entry.id}`}
            className="flex min-h-14 flex-col gap-1 px-4 py-3 hover:bg-zinc-50 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 dark:hover:bg-zinc-900"
          >
            <span className="break-words text-sm font-medium text-zinc-950 sm:truncate dark:text-zinc-50">
              {entry.title}
            </span>
            <time
              dateTime={entry.createdAt.toISOString()}
              className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
            >
              {formatDateTime(entry.createdAt)}
            </time>
          </Link>
        </li>
      ))}
    </ul>
  );
}
