import Link from "next/link";
import { verifySession } from "@/lib/auth/dal";
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
  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <Link
          href="/app"
          className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          {APP_NAME}
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10">{children}</main>
    </div>
  );
}
