import { describe, expect, it } from "vitest";
import {
  RESET_TOKEN_TTL_MS,
  generateResetToken,
  hashResetToken,
  resetTokenExpiry,
} from "./reset-token";

describe("reset-token", () => {
  it("generates a base64url token without padding", () => {
    const { raw } = generateResetToken();
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(raw).not.toContain("=");
    expect(raw.length).toBeGreaterThanOrEqual(40);
  });

  it("returns a stable sha-256 hex hash for the same raw token", () => {
    const { raw, hash } = generateResetToken();
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashResetToken(raw)).toBe(hash);
  });

  it("returns different raw tokens on each generation", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });

  it("computes expiry exactly TTL ms after the supplied now", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const exp = resetTokenExpiry(now);
    expect(exp.getTime() - now.getTime()).toBe(RESET_TOKEN_TTL_MS);
  });
});
