import Link from "next/link";
import {
  confirmPasswordResetAction,
  verifyResetToken,
} from "@/lib/auth/reset-actions";
import { ResetPasswordForm } from "../_components/reset-password-form";

type SearchParams = Promise<{ token?: string | string[] }>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const tokenParam = params?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  if (!token) {
    return (
      <InvalidLink
        message="No reset token in this URL. Use the link from your email, or request a new one."
      />
    );
  }

  const result = await verifyResetToken(token);
  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "This reset link has expired. Request a new one to continue."
        : result.reason === "used"
          ? "This reset link was already used. Request a new one if you still need to reset."
          : "This reset link is invalid. Request a new one to continue.";
    return <InvalidLink message={message} />;
  }

  return (
    <ResetPasswordForm token={token} action={confirmPasswordResetAction} />
  );
}

function InvalidLink({ message }: { message: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Reset link unavailable
      </h1>
      <p
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
      >
        {message}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          href="/forgot-password"
          className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          Request a new reset link
        </Link>
      </p>
    </div>
  );
}
