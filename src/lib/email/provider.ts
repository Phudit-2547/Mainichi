import "server-only";
import { env } from "@/lib/env";
import { createLogProvider } from "./log";
import { createResendProvider } from "./resend";
import { createSmtpProvider } from "./smtp";
import type { EmailProvider } from "./types";

let cached: EmailProvider | null = null;

export function emailProvider(): EmailProvider {
  if (cached) return cached;
  const e = env();
  const from = e.EMAIL_FROM ?? "Mainichi <noreply@example.com>";

  switch (e.EMAIL_PROVIDER) {
    case "resend": {
      if (!e.RESEND_API_KEY) {
        throw new Error(
          "EMAIL_PROVIDER=resend requires RESEND_API_KEY to be set.",
        );
      }
      cached = createResendProvider({ apiKey: e.RESEND_API_KEY, from });
      return cached;
    }
    case "smtp": {
      if (!e.SMTP_HOST) {
        throw new Error(
          "EMAIL_PROVIDER=smtp requires at least SMTP_HOST (and usually SMTP_PORT, SMTP_USER, SMTP_PASS).",
        );
      }
      cached = createSmtpProvider({
        host: e.SMTP_HOST,
        port: e.SMTP_PORT ?? 587,
        user: e.SMTP_USER,
        pass: e.SMTP_PASS,
        secure: e.SMTP_SECURE ?? false,
        from,
      });
      return cached;
    }
    case "log":
    default:
      cached = createLogProvider({ from });
      return cached;
  }
}

export function appUrl(): string {
  const e = env();
  if (e.APP_URL) return e.APP_URL.replace(/\/$/, "");
  // Vercel injects VERCEL_URL (host without protocol) for preview deploys.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
