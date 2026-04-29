import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { readSession } from "./session";

export const verifySession = cache(async () => {
  const session = await readSession();
  if (!session) redirect("/sign-in");
  return session;
});

export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  const [row] = await db()
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!row) redirect("/sign-in");
  return row;
});
