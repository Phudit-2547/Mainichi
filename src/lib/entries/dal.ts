import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { entries, type Entry } from "@/lib/db/schema";

export type EntrySummary = Pick<
  Entry,
  "id" | "title" | "journalDate" | "createdAt" | "updatedAt"
>;

// Every read and mutation is scoped by `userId`. Callers must pass the
// authenticated user's id from the data-access layer (`getCurrentUser`).
// Passing the wrong id never reveals data: rows for other users return
// nothing and updates affect zero rows.

export async function listEntries(userId: string): Promise<EntrySummary[]> {
  return db()
    .select({
      id: entries.id,
      title: entries.title,
      journalDate: entries.journalDate,
      createdAt: entries.createdAt,
      updatedAt: entries.updatedAt,
    })
    .from(entries)
    .where(eq(entries.userId, userId))
    .orderBy(desc(entries.createdAt));
}

export async function getEntry(
  userId: string,
  entryId: string,
): Promise<Entry | null> {
  const [row] = await db()
    .select()
    .from(entries)
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createEntry(
  userId: string,
  input: { title: string; body: string; encV?: number },
): Promise<Entry> {
  const [row] = await db()
    .insert(entries)
    .values({ userId, title: input.title, body: input.body, encV: input.encV ?? 1 })
    .returning();
  if (!row) throw new Error("failed to insert entry");
  return row;
}

export async function updateEntry(
  userId: string,
  entryId: string,
  input: { title: string; body: string; encV?: number },
): Promise<Entry | null> {
  const [row] = await db()
    .update(entries)
    .set({
      title: input.title,
      body: input.body,
      encV: input.encV ?? 1,
      revision: sql<number>`${entries.revision} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(entries.id, entryId),
        eq(entries.userId, userId),
        isNull(entries.journalDate),
      ),
    )
    .returning();
  return row ?? null;
}

export async function deleteEntry(
  userId: string,
  entryId: string,
): Promise<boolean> {
  const rows = await db()
    .delete(entries)
    .where(
      and(
        eq(entries.id, entryId),
        eq(entries.userId, userId),
        isNull(entries.journalDate),
      ),
    )
    .returning({ id: entries.id });
  return rows.length > 0;
}
