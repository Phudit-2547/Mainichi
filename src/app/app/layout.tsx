import Link from "next/link";
import { CryptoGuard } from "@/lib/crypto/context";
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
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur supports-[backdrop-filter]:bg-zinc-50/80 dark:border-zinc-800 dark:bg-black/90 dark:supports-[backdrop-filter]:bg-black/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href="/app/entries"
            className="-m-2 inline-flex min-h-11 items-center p-2 text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
          >
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[16ch] truncate text-xs text-zinc-500 sm:inline dark:text-zinc-400">
              {user.email}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-6 sm:py-10">
        <CryptoGuard>{children}</CryptoGuard>
      </main>
    </div>
  );
}
