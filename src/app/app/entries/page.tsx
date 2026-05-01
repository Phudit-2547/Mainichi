import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { listEntries } from "@/lib/entries/dal";
import { EntriesList } from "./_components/entries-list";

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

      <EntriesList entries={entries} />
    </div>
  );
}
