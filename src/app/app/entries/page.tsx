import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { listEntries } from "@/lib/entries/dal";
import { formatDateTime } from "./_components/format";

export default async function EntriesIndexPage() {
  const user = await getCurrentUser();
  const entries = await listEntries(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Entries
        </h1>
        <Link
          href="/app/entries/new"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-zinc-50 shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          New entry
        </Link>
      </div>

      {entries.length === 0 ? (
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
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-md border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
          {entries.map((entry) => (
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
      )}
    </div>
  );
}
