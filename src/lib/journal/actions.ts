"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import type { Entry } from "@/lib/db/schema";
import {
  createJournalEntry,
  getJournalEntryByDate,
  listJournalEntries,
  saveJournalEntry,
} from "./dal";
import {
  CreateJournalEntrySchema,
  JournalDateSchema,
  SaveJournalEntrySchema,
} from "./schemas";
import type { JournalEntryWire, SaveJournalEntryResult } from "./types";

function toWire(entry: Entry): JournalEntryWire {
  if (!entry.journalDate) {
    throw new Error("Expected a dated journal entry");
  }

  return {
    id: entry.id,
    journalDate: entry.journalDate,
    body: entry.body,
    revision: entry.revision,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export async function loadJournalEntryAction(
  journalDate: string,
): Promise<JournalEntryWire | null> {
  const parsedDate = JournalDateSchema.safeParse(journalDate);
  if (!parsedDate.success) throw new Error(parsedDate.error.message);

  const user = await getCurrentUser();
  const entry = await getJournalEntryByDate(user.id, parsedDate.data);
  return entry ? toWire(entry) : null;
}

export async function createJournalEntryAction(
  input: unknown,
): Promise<JournalEntryWire> {
  const parsed = CreateJournalEntrySchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.message);

  const user = await getCurrentUser();
  const entry = await createJournalEntry(user.id, parsed.data);
  revalidatePath("/app/entries");
  revalidatePath(`/app/journal/${entry.journalDate}`);
  return toWire(entry);
}

export async function saveJournalEntryAction(
  input: unknown,
): Promise<SaveJournalEntryResult> {
  const parsed = SaveJournalEntrySchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.message);

  const user = await getCurrentUser();
  const result = await saveJournalEntry(user.id, parsed.data);

  if (result.status === "updated") {
    revalidatePath("/app/entries");
    revalidatePath(`/app/journal/${result.entry.journalDate}`);
    return { status: "updated", entry: toWire(result.entry) };
  }
  if (result.status === "conflict") {
    return { status: "conflict", entry: toWire(result.entry) };
  }
  return result;
}

export async function listJournalEntriesAction(): Promise<JournalEntryWire[]> {
  const user = await getCurrentUser();
  const journalEntries = await listJournalEntries(user.id);
  return journalEntries.map(toWire);
}
