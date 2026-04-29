import { signOutAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/dal";

export default async function AppHome() {
  const user = await getCurrentUser();
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Signed in
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Hello, {user.email}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Entry CRUD lands in MS-3. This page just proves the protected route
          guard works end-to-end.
        </p>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
