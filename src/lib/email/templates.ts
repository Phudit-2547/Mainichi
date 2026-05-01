import "server-only";
import type { EmailMessage } from "./types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function passwordResetEmail(opts: {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
}): EmailMessage {
  const safeUrl = escapeHtml(opts.resetUrl);
  const subject = "Reset your Mainichi password";
  const text = [
    "Someone requested a password reset for your Mainichi account.",
    "",
    `If that was you, open this link within ${opts.expiresInMinutes} minutes:`,
    opts.resetUrl,
    "",
    "Heads up: Mainichi journal entries are end-to-end encrypted with a key",
    "derived from your password. Resetting your password will permanently",
    "delete your existing entries. We can't recover them.",
    "",
    "If you did not request this, you can ignore this email — your password",
    "will not change.",
  ].join("\n");

  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#18181b;">
  <p>Someone requested a password reset for your Mainichi account.</p>
  <p>If that was you, open this link within <strong>${opts.expiresInMinutes} minutes</strong>:</p>
  <p><a href="${safeUrl}" style="display:inline-block;padding:10px 16px;background:#18181b;color:#fafafa;border-radius:6px;text-decoration:none;">Reset password</a></p>
  <p style="word-break:break-all;color:#52525b;font-size:12px;">${safeUrl}</p>
  <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">
  <p><strong>Heads up:</strong> Mainichi journal entries are end-to-end encrypted with a key derived from your password. Resetting your password will <strong>permanently delete your existing entries</strong>. We can't recover them.</p>
  <p style="color:#52525b;">If you did not request this, you can ignore this email — your password will not change.</p>
</body></html>`;

  return { to: opts.to, subject, text, html };
}
