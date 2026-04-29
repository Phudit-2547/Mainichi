import { describe, expect, it } from "vitest";
import { APP_NAME, APP_VERSION } from "./version";

describe("app metadata", () => {
  it("has a non-empty name", () => {
    expect(APP_NAME).toBe("Mainichi");
  });

  it("uses semver-shaped version", () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
