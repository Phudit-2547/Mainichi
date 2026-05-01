import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { readSession } from "@/lib/auth/session";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [row] = await db()
    .select({ kdfSalt: users.kdfSalt })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!row) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // kdfSalt is a Buffer (bytea from Postgres). Encode as base64url for the client.
  const buf = row.kdfSalt as Buffer;
  const kdfSalt = buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return Response.json({ kdfSalt });
}
