import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, entries } from "@/lib/db/schema";
import {
  createEntry,
  deleteEntry,
  getEntry,
  listEntries,
  updateEntry,
} from "./dal";
import { createJournalEntry } from "@/lib/journal/dal";

// Integration test: requires DATABASE_URL with migrations applied. CI provides
// this; locally `docker compose -f docker-compose.dev.yml up -d` + `pnpm
// db:migrate` is enough. Skip cleanly when no DB is configured so contributors
// without Docker still get a green `pnpm test`.
const dbAvailable = Boolean(process.env.DATABASE_URL);

const stubHash = "$argon2id$v=19$m=19456,t=2,p=1$YWFhYWFhYWFhYWFhYWFhYQ$X";
const stubSalt = Buffer.alloc(16, 1);

async function makeUser(email: string): Promise<string> {
  const [row] = await db()
    .insert(users)
    .values({ email, passwordHash: stubHash, kdfSalt: stubSalt })
    .returning({ id: users.id });
  if (!row) throw new Error("failed to create test user");
  return row.id;
}

describe.skipIf(!dbAvailable)("entries DAL", () => {
  const createdUserIds: string[] = [];
  let alice = "";
  let bob = "";

  beforeAll(async () => {
    alice = await makeUser(`alice+${Date.now()}@test.local`);
    bob = await makeUser(`bob+${Date.now()}@test.local`);
    createdUserIds.push(alice, bob);
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await db().delete(users).where(inArray(users.id, createdUserIds));
    }
  });

  beforeEach(async () => {
    // Clear entries between tests so order/count assertions are deterministic.
    await db().delete(entries).where(inArray(entries.userId, createdUserIds));
  });

  it("creates and reads back an entry scoped to its owner", async () => {
    const created = await createEntry(alice, {
      title: "First",
      body: "# Hello\n\nworld",
    });
    expect(created.userId).toBe(alice);
    expect(created.title).toBe("First");

    const fetched = await getEntry(alice, created.id);
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.body).toBe("# Hello\n\nworld");
  });

  it("does not return another user's entry", async () => {
    const created = await createEntry(alice, { title: "Private", body: "x" });
    const result = await getEntry(bob, created.id);
    expect(result).toBeNull();
  });

  it("lists only the caller's entries, newest first", async () => {
    const a1 = await createEntry(alice, { title: "Older", body: "" });
    // Force a distinct created_at so ordering is deterministic.
    await new Promise((r) => setTimeout(r, 5));
    const a2 = await createEntry(alice, { title: "Newer", body: "" });
    await createEntry(bob, { title: "Bob's secret", body: "" });

    const list = await listEntries(alice);
    expect(list.map((e) => e.id)).toEqual([a2.id, a1.id]);
    expect(list.find((e) => e.title === "Bob's secret")).toBeUndefined();
  });

  it("update is no-op for entries owned by someone else", async () => {
    const created = await createEntry(alice, { title: "Original", body: "" });
    const result = await updateEntry(bob, created.id, {
      title: "Hacked",
      body: "pwned",
    });
    expect(result).toBeNull();

    const stillOriginal = await getEntry(alice, created.id);
    expect(stillOriginal?.title).toBe("Original");
    expect(stillOriginal?.body).toBe("");
  });

  it("generic update refuses daily-journal entries", async () => {
    const created = await createJournalEntry(alice, {
      journalDate: "2026-09-04",
      title: "encrypted-title",
      body: "encrypted-body",
    });

    const result = await updateEntry(alice, created.id, {
      title: "legacy-editor-title",
      body: "legacy-editor-body",
    });
    expect(result).toBeNull();

    const unchanged = await getEntry(alice, created.id);
    expect(unchanged?.title).toBe("encrypted-title");
    expect(unchanged?.body).toBe("encrypted-body");
    expect(unchanged?.revision).toBe(1);
  });

  it("generic delete refuses daily-journal entries", async () => {
    const created = await createJournalEntry(alice, {
      journalDate: "2026-09-04",
      title: "encrypted-title",
      body: "encrypted-body",
    });

    expect(await deleteEntry(alice, created.id)).toBe(false);
    expect(await getEntry(alice, created.id)).not.toBeNull();
  });

  it("update bumps updated_at past created_at", async () => {
    const created = await createEntry(alice, { title: "v1", body: "" });
    await new Promise((r) => setTimeout(r, 5));
    const updated = await updateEntry(alice, created.id, {
      title: "v2",
      body: "rev",
    });
    expect(updated?.title).toBe("v2");
    expect(updated?.updatedAt.getTime()).toBeGreaterThan(
      updated?.createdAt.getTime() ?? 0,
    );
  });

  it("delete is a no-op for non-owners and removes the row for the owner", async () => {
    const created = await createEntry(alice, { title: "Doomed", body: "" });
    const wrong = await deleteEntry(bob, created.id);
    expect(wrong).toBe(false);
    expect(await getEntry(alice, created.id)).not.toBeNull();

    const right = await deleteEntry(alice, created.id);
    expect(right).toBe(true);
    expect(await getEntry(alice, created.id)).toBeNull();
  });

  it("cascades on user delete", async () => {
    const tempUser = await makeUser(`carol+${Date.now()}@test.local`);
    const e = await createEntry(tempUser, { title: "ephemeral", body: "" });
    await db().delete(users).where(eq(users.id, tempUser));
    const surviving = await db()
      .select({ id: entries.id })
      .from(entries)
      .where(eq(entries.id, e.id));
    expect(surviving).toHaveLength(0);
  });
});
