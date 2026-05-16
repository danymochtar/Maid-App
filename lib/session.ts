import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "./db";

const COOKIE_NAME = "pembantu_session";
const COOKIE_TTL = 60 * 60 * 24 * 30; // 30 days
const SECRET =
  process.env.SESSION_SECRET ||
  process.env.BETTER_AUTH_SECRET ||
  "dev-only-fallback-secret-set-BETTER_AUTH_SECRET-in-prod";

function sign(userId: string): string {
  const hmac = createHmac("sha256", SECRET).update(userId).digest("hex");
  return `${userId}.${hmac}`;
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", SECRET).update(userId).digest("hex");
  try {
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return userId;
  } catch {}
  return null;
}

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_TTL,
    path: "/",
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const c = jar.get(COOKIE_NAME);
  if (!c) return null;
  return verify(c.value);
}

export type SessionUser = {
  id: string;
  role: "CLIENT" | "HELPER" | "ADMIN";
  displayName: string;
  email: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  try {
    const u = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        email: true,
        helperProfile: { select: { displayName: true } },
        clientProfile: { select: { fullName: true } },
      },
    });
    if (!u) return null;
    return {
      id: u.id,
      role: u.role,
      email: u.email,
      displayName: u.helperProfile?.displayName ?? u.clientProfile?.fullName ?? "User",
    };
  } catch (e) {
    // DB unreachable (e.g., DATABASE_URL not set in this env). Treat as
    // logged-out so the page can still render — protected pages will
    // redirect to /login, and /login itself doesn't need this lookup.
    console.error("[session] DB lookup failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Error("Not authenticated");
  return u;
}
