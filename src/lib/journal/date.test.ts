import { describe, expect, it } from "vitest";
import {
  isJournalDate,
  journalExportPath,
  shiftJournalDate,
  toLocalJournalDate,
} from "./date";

describe("journal dates", () => {
  it("accepts real ISO calendar dates and rejects impossible dates", () => {
    expect(isJournalDate("2024-02-29")).toBe(true);
    expect(isJournalDate("2026-02-29")).toBe(false);
    expect(isJournalDate("2026-13-01")).toBe(false);
    expect(isJournalDate("04-09-2026")).toBe(false);
  });

  it("uses local calendar components instead of UTC conversion", () => {
    const local = new Date(2026, 8, 4, 0, 5, 0);
    expect(toLocalJournalDate(local)).toBe("2026-09-04");
  });

  it("shifts safely across month and year boundaries", () => {
    expect(shiftJournalDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftJournalDate("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("maps a daily entry to an Obsidian-friendly export path", () => {
    expect(journalExportPath("2026-09-04")).toBe(
      "Journal/2026/09/2026-09-04.md",
    );
  });
});
