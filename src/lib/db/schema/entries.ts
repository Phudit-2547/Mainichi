import { index, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

// title and body store either plaintext (enc_v=0, legacy) or AES-256-GCM
// ciphertext in the format `v1:<base64url-iv>:<base64url-ct>` (enc_v=1).
// The server never decrypts these columns; all decryption is client-side.
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
    // 0 = plaintext (pre-MS-5), 1 = AES-256-GCM via PBKDF2-SHA-256
    encV: smallint("enc_v").notNull().default(0),
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
