import Link from "next/link";

export default function EntryNotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Entry not found
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        The entry you&apos;re looking for doesn&apos;t exist or you don&apos;t
        have access to it.
      </p>
      <Link
        href="/app/entries"
        className="inline-block text-sm font-medium text-zinc-950 underline underline-offset-4 dark:text-zinc-50"
      >
        Back to entries
      </Link>
    </div>
  );
}
