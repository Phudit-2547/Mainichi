import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { env } from "@/lib/env";
import {
  decryptToken,
  encryptToken,
  type SessionPayload,
} from "./session-token";

export const SESSION_COOKIE = "mainichi_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type { SessionPayload };

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const [row] = await db()
    .insert(sessions)
    .values({ userId, expiresAt })
    .returning({ id: sessions.id });
  if (!row) throw new Error("failed to create session row");

  const token = await encryptToken(
    { sid: row.id, uid: userId },
    expiresAt,
    env().AUTH_SECRET,
  );
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env().NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const payload = await decryptToken(token, env().AUTH_SECRET);
    if (payload?.sid) {
      try {
        await db().delete(sessions).where(eq(sessions.id, payload.sid));
      } catch {
        // best-effort: cookie deletion is the user-visible part
      }
    }
  }
  store.delete(SESSION_COOKIE);
}

export type ActiveSession = {
  sessionId: string;
  userId: string;
  expiresAt: Date;
};

export async function readSession(): Promise<ActiveSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await decryptToken(token, env().AUTH_SECRET);
  if (!payload) return null;

  const [row] = await db()
    .select({
      id: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(eq(sessions.id, payload.sid))
    .limit(1);

  if (!row) return null;
  if (row.userId !== payload.uid) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    try {
      await db().delete(sessions).where(eq(sessions.id, row.id));
    } catch {
      // ignore
    }
    return null;
  }

  return {
    sessionId: row.id,
    userId: row.userId,
    expiresAt: row.expiresAt,
  };
}
