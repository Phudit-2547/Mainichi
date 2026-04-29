import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/version";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();
  if (session) redirect("/app");

  return (
    <main className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-black">
      <header className="px-6 py-5">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
        >
          {APP_NAME}
        </Link>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
