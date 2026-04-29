import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export default async function Home() {
  const session = await readSession();
  if (session) redirect("/app");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-zinc-50 px-6 py-24 text-center font-sans dark:bg-black">
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
      <div className="flex gap-3">
        <Link
          href="/sign-in"
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
