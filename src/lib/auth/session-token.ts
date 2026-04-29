import { SignJWT, jwtVerify } from "jose";

// Pure token encrypt/decrypt helpers. Kept separate from `session.ts` so that
// unit tests can exercise them without pulling in `server-only`, the DB
// client, or `next/headers`.

export type SessionPayload = {
  sid: string;
  uid: string;
  exp?: number;
  iat?: number;
};

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function encryptToken(
  payload: SessionPayload,
  expiresAt: Date,
  secret: string,
): Promise<string> {
  return new SignJWT({ sid: payload.sid, uid: payload.uid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(key(secret));
}

export async function decryptToken(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sid !== "string" || typeof payload.uid !== "string") {
      return null;
    }
    return {
      sid: payload.sid,
      uid: payload.uid,
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch {
    return null;
  }
}
