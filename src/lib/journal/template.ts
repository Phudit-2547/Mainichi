import { getLocalTimeZone, isJournalDate } from "./date";

type JournalTemplateOptions = {
  journalDate: string;
  now?: Date;
  timeZone?: string;
};

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function localDateTime(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`;
}

export function createJournalTemplate({
  journalDate,
  now = new Date(),
  timeZone = getLocalTimeZone(),
}: JournalTemplateOptions): string {
  if (!isJournalDate(journalDate)) {
    throw new Error(`Invalid journal date: ${journalDate}`);
  }

  const createdAt = localDateTime(now, timeZone);

  return `---
journalDate: ${journalDate}
creationDate: ${yamlString(createdAt)}
modifiedDate: ${yamlString(createdAt)}
timezone: ${yamlString(timeZone)}
location: Unknown
coordinates: unknown
weather: Unknown
---

### 🌅 Morning
-

### 🌞 Afternoon
-

### 🌙 Evening
-

### ⚡ Energy
- Best moment:
- Worst moment:

### 💭 Thoughts
-

### Grateful for
-

### Tomorrow
- [ ]
`;
}
