import { APP_NAME, APP_VERSION } from "@/lib/version";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-24 text-center font-sans dark:bg-black">
      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        v{APP_VERSION}
      </span>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl dark:text-zinc-50">
        {APP_NAME}
      </h1>
      <p className="max-w-md text-balance text-base leading-7 text-zinc-600 dark:text-zinc-400">
        A self-hostable, end-to-end encrypted journal. Skeleton scaffold —
        check back as the milestones land.
      </p>
    </main>
  );
}
