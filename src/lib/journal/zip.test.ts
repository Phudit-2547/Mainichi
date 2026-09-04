import { describe, expect, it } from "vitest";
import { crc32, createStoredZip } from "./zip";

describe("Markdown ZIP export", () => {
  it("uses the standard CRC-32 checksum", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("creates a ZIP32 archive containing UTF-8 paths and Markdown", () => {
    const archive = createStoredZip([
      {
        path: "Journal/2026/09/2026-09-04.md",
        content: "### 💭 Thoughts\n- test\n",
        modifiedAt: new Date(2026, 8, 4, 12, 0, 0),
      },
    ]);
    const view = new DataView(archive.buffer);
    const decoded = new TextDecoder().decode(archive);

    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(archive.byteLength - 22, true)).toBe(0x06054b50);
    expect(decoded).toContain("Journal/2026/09/2026-09-04.md");
    expect(decoded).toContain("### 💭 Thoughts");
  });
});
