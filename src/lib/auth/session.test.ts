import { describe, expect, it } from "vitest";
import { decryptToken, encryptToken } from "./session-token";

const SECRET = "test-only-secret-32-chars-minimum-aaaaaa";

describe("session token (jose)", () => {
  it("round-trips a payload through encrypt/decrypt", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const token = await encryptToken(
      { sid: "sess_1", uid: "user_1" },
      expiresAt,
      SECRET,
    );
    const decoded = await decryptToken(token, SECRET);
    expect(decoded?.sid).toBe("sess_1");
    expect(decoded?.uid).toBe("user_1");
  });

  it("rejects a tampered token", async () => {
    const token = await encryptToken(
      { sid: "sess_2", uid: "user_2" },
      new Date(Date.now() + 60_000),
      SECRET,
    );
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    const decoded = await decryptToken(tampered, SECRET);
    expect(decoded).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await encryptToken(
      { sid: "sess_3", uid: "user_3" },
      new Date(Date.now() + 60_000),
      SECRET,
    );
    const decoded = await decryptToken(
      token,
      "another-different-secret-32-chars-aaa",
    );
    expect(decoded).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await encryptToken(
      { sid: "sess_4", uid: "user_4" },
      new Date(Date.now() - 1_000),
      SECRET,
    );
    const decoded = await decryptToken(token, SECRET);
    expect(decoded).toBeNull();
  });
});
