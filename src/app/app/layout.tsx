import Link from "next/link";
import { signOutAction } from "@/lib/auth/actions";
import { getCurrentUser, verifySession } from "@/lib/auth/dal";
import { APP_NAME } from "@/lib/version";

// `verifySession()` redirects to /sign-in if no active session is found, so any
// route nested under this layout is automatically guarded. Kept here as a
// single chokepoint per AGENTS.md.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await verifySession();
  const user = await getCurrentUser();
  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/app/entries"
            className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
          >
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-zinc-500 sm:inline dark:text-zinc-400">
              {user.email}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10">{children}</main>
    </div>
  );
}
