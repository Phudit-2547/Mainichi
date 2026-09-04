export type JournalEntryWire = {
  id: string;
  journalDate: string;
  body: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type SaveJournalEntryResult =
  | { status: "updated"; entry: JournalEntryWire }
  | { status: "conflict"; entry: JournalEntryWire }
  | { status: "not-found" };
