const JOURNAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function isJournalDate(value: string): boolean {
  const match = JOURNAL_DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function toLocalJournalDate(now: Date = new Date()): string {
  return [
    now.getFullYear(),
    pad2(now.getMonth() + 1),
    pad2(now.getDate()),
  ].join("-");
}

export function shiftJournalDate(journalDate: string, days: number): string {
  if (!isJournalDate(journalDate)) {
    throw new Error(`Invalid journal date: ${journalDate}`);
  }

  const [year, month, day] = journalDate.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return [
    shifted.getUTCFullYear(),
    pad2(shifted.getUTCMonth() + 1),
    pad2(shifted.getUTCDate()),
  ].join("-");
}

export function journalExportPath(journalDate: string): string {
  if (!isJournalDate(journalDate)) {
    throw new Error(`Invalid journal date: ${journalDate}`);
  }

  const [year, month] = journalDate.split("-");
  return `Journal/${year}/${month}/${journalDate}.md`;
}

export function getLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
