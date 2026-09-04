import { describe, expect, it } from "vitest";
import { createJournalTemplate } from "./template";

describe("daily journal template", () => {
  it("creates deterministic frontmatter and the expected journal sections", () => {
    const body = createJournalTemplate({
      journalDate: "2026-09-04",
      now: new Date("2026-09-04T06:30:00.000Z"),
      timeZone: "Asia/Bangkok",
    });

    expect(body).toContain("journalDate: 2026-09-04");
    expect(body).toContain('creationDate: "2026-09-04T13:30"');
    expect(body).toContain('modifiedDate: "2026-09-04T13:30"');
    expect(body).toContain('timezone: "Asia/Bangkok"');
    expect(body).toContain("### 🌅 Morning");
    expect(body).toContain("### 🌞 Afternoon");
    expect(body).toContain("### 🌙 Evening");
    expect(body).toContain("### 💭 Thoughts");
    expect(body).toContain("### Tomorrow");
  });
});
