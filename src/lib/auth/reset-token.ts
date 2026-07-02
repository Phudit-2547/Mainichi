import "server-only";
import { createHash, randomBytes } from "node:crypto";

export const RESET_TOKEN_TTL_MINUTES = 15;
export const RESET_TOKEN_TTL_MS = RESET_TOKEN_TTL_MINUTES * 60 * 1000;

// 32 random bytes → 43-char base64url. Plenty of entropy that brute-forcing
// is infeasible inside the 15-minute window.
const TOKEN_BYTES = 32;

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateResetToken(): { raw: string; hash: string } {
  const raw = base64url(randomBytes(TOKEN_BYTES));
  return { raw, hash: hashResetToken(raw) };
}

export function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function resetTokenExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MS);
}
