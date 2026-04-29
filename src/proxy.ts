import { NextResponse, type NextRequest } from "next/server";
import { decryptToken } from "@/lib/auth/session-token";

const SESSION_COOKIE = "mainichi_session";

// Optimistic auth check that runs before route handlers, per the Next.js 16
// authentication guide. The DB-backed `verifySession()` in the (app) layout
// is still authoritative — this is just an early redirect to keep prefetched
// /app navigations from flashing the page before the layout runs.
export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;

  let hasValidToken = false;
  if (token && secret) {
    const payload = await decryptToken(token, secret);
    hasValidToken = payload !== null;
  }

  if (!hasValidToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
