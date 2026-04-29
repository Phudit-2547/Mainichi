import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

// MS-3 stores plaintext markdown; MS-5 will swap title/body to ciphertext
// (base64 in-place or bytea + iv/algo columns added in a follow-up migration).
// Schema is ciphertext-ready: no full-text indexes on user content, no DB-side
// content constraints, ownership FK independent of column shape.
export const entries = pgTable(
  "entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("entries_user_created_idx").on(t.userId, t.createdAt.desc())],
);

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
