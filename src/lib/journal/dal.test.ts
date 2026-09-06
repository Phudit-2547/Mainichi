import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { entries, users } from "@/lib/db/schema";
import {
  createJournalEntry,
  getJournalEntryByDate,
  listJournalEntries,
  saveJournalEntry,
} from "./dal";

const dbAvailable = Boolean(process.env.DATABASE_URL);
const stubHash = "$argon2id$v=19$m=19456,t=2,p=1$YWFhYWFhYWFhYWFhYWFhYQ$X";
const stubSalt = Buffer.alloc(16, 2);

async function makeUser(email: string): Promise<string> {
  const [row] = await db()
    .insert(users)
    .values({ email, passwordHash: stubHash, kdfSalt: stubSalt })
    .returning({ id: users.id });
  if (!row) throw new Error("failed to create test user");
  return row.id;
}

describe.skipIf(!dbAvailable)("daily journal DAL", () => {
  const userIds: string[] = [];
  let alice = "";
  let bob = "";

  beforeAll(async () => {
    alice = await makeUser(`journal-alice+${Date.now()}@test.local`);
    bob = await makeUser(`journal-bob+${Date.now()}@test.local`);
    userIds.push(alice, bob);
  });

  afterAll(async () => {
    await db().delete(users).where(inArray(users.id, userIds));
  });

  beforeEach(async () => {
    await db().delete(entries).where(inArray(entries.userId, userIds));
  });

  it("creates at most one entry per user and local calendar date", async () => {
    const first = await createJournalEntry(alice, {
      journalDate: "2026-09-04",
      title: "encrypted-title-1",
      body: "encrypted-body-1",
    });
    const second = await createJournalEntry(alice, {
      journalDate: "2026-09-04",
      title: "encrypted-title-2",
      body: "encrypted-body-2",
    });

    expect(second.id).toBe(first.id);
    expect(second.body).toBe("encrypted-body-1");
    expect(second.revision).toBe(1);
  });

  it("allows different users to have an entry on the same date", async () => {
    const a = await createJournalEntry(alice, {
      journalDate: "2026-09-04",
      title: "a",
      body: "a",
    });
    const b = await createJournalEntry(bob, {
      journalDate: "2026-09-04",
      title: "b",
      body: "b",
    });

    expect(a.id).not.toBe(b.id);
    expect(await getJournalEntryByDate(alice, "2026-09-04")).not.toBeNull();
    expect(await getJournalEntryByDate(bob, "2026-09-04")).not.toBeNull();
  });

  it("increments revisions and reports stale writes as conflicts", async () => {
    const created = await createJournalEntry(alice, {
      journalDate: "2026-09-04",
      title: "title",
      body: "v1",
    });

    const saved = await saveJournalEntry(alice, {
      entryId: created.id,
      expectedRevision: 1,
      body: "v2",
    });
    expect(saved.status).toBe("updated");
    if (saved.status !== "updated") throw new Error("expected update");
    expect(saved.entry.revision).toBe(2);
    expect(saved.entry.body).toBe("v2");

    const stale = await saveJournalEntry(alice, {
      entryId: created.id,
      expectedRevision: 1,
      body: "stale-write",
    });
    expect(stale.status).toBe("conflict");
    if (stale.status !== "conflict") throw new Error("expected conflict");
    expect(stale.entry.revision).toBe(2);
    expect(stale.entry.body).toBe("v2");
  });

  it("lists dated entries in export order", async () => {
    await createJournalEntry(alice, {
      journalDate: "2026-09-05",
      title: "later",
      body: "later",
    });
    await createJournalEntry(alice, {
      journalDate: "2026-09-04",
      title: "earlier",
      body: "earlier",
    });
    await createJournalEntry(bob, {
      journalDate: "2026-09-03",
      title: "other-user",
      body: "other-user",
    });

    const result = await listJournalEntries(alice);
    expect(result.map((entry) => entry.journalDate)).toEqual([
      "2026-09-04",
      "2026-09-05",
    ]);
  });
});
