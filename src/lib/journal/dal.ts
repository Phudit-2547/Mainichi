import "server-only";
import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { entries, type Entry } from "@/lib/db/schema";

export type JournalSaveResult =
  | { status: "updated"; entry: Entry }
  | { status: "conflict"; entry: Entry }
  | { status: "not-found" };

export async function getJournalEntryByDate(
  userId: string,
  journalDate: string,
): Promise<Entry | null> {
  const [row] = await db()
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        eq(entries.journalDate, journalDate),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createJournalEntry(
  userId: string,
  input: { journalDate: string; title: string; body: string },
): Promise<Entry> {
  const [inserted] = await db()
    .insert(entries)
    .values({
      userId,
      journalDate: input.journalDate,
      title: input.title,
      body: input.body,
      encV: 1,
      revision: 1,
    })
    .onConflictDoNothing({
      target: [entries.userId, entries.journalDate],
    })
    .returning();

  if (inserted) return inserted;

  const existing = await getJournalEntryByDate(userId, input.journalDate);
  if (!existing) {
    throw new Error("Journal entry insert conflicted but no entry was found");
  }
  return existing;
}

export async function saveJournalEntry(
  userId: string,
  input: { entryId: string; expectedRevision: number; body: string },
): Promise<JournalSaveResult> {
  const [updated] = await db()
    .update(entries)
    .set({
      body: input.body,
      encV: 1,
      revision: sql<number>`${entries.revision} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(entries.id, input.entryId),
        eq(entries.userId, userId),
        isNotNull(entries.journalDate),
        eq(entries.revision, input.expectedRevision),
      ),
    )
    .returning();

  if (updated) return { status: "updated", entry: updated };

  const [existing] = await db()
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.id, input.entryId),
        eq(entries.userId, userId),
        isNotNull(entries.journalDate),
      ),
    )
    .limit(1);

  if (!existing) return { status: "not-found" };
  return { status: "conflict", entry: existing };
}

export async function listJournalEntries(userId: string): Promise<Entry[]> {
  return db()
    .select()
    .from(entries)
    .where(
      and(eq(entries.userId, userId), isNotNull(entries.journalDate)),
    )
    .orderBy(asc(entries.journalDate));
}
