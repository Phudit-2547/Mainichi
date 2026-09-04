import { describe, expect, it } from "vitest";
import { decryptText, encryptText, isEncrypted } from "./e2e";

describe("journal encryption payloads", () => {
  it("round-trips a large UTF-8 journal without argument-limit failures", async () => {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
    const plaintext = "ก".repeat(70_000);

    const encrypted = await encryptText(key, plaintext);

    expect(isEncrypted(encrypted)).toBe(true);
    expect(await decryptText(key, encrypted)).toBe(plaintext);
  });
});
