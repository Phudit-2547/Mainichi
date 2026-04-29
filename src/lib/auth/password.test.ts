import { describe, expect, it } from "vitest";
import {
  generateKdfSalt,
  hashPassword,
  verifyPassword,
} from "./password";

describe("password hashing", () => {
  it("verifies the same password against its hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(
      verifyPassword("correct-horse-battery-staple", hash),
    ).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("rejects empty inputs without throwing", async () => {
    const hash = await hashPassword("a-real-password-12345");
    await expect(verifyPassword("", hash)).resolves.toBe(false);
    await expect(verifyPassword("anything", "")).resolves.toBe(false);
  });

  it("produces a different hash each time (random salt)", async () => {
    const a = await hashPassword("same-password-please");
    const b = await hashPassword("same-password-please");
    expect(a).not.toBe(b);
    await expect(verifyPassword("same-password-please", a)).resolves.toBe(true);
    await expect(verifyPassword("same-password-please", b)).resolves.toBe(true);
  });

  it("throws on empty password to prevent silent misuse", async () => {
    await expect(hashPassword("")).rejects.toThrow();
  });
});

describe("kdf salt", () => {
  it("returns 16 random bytes", () => {
    const a = generateKdfSalt();
    const b = generateKdfSalt();
    expect(a).toBeInstanceOf(Buffer);
    expect(a.length).toBe(16);
    expect(b.length).toBe(16);
    expect(a.equals(b)).toBe(false);
  });
});
