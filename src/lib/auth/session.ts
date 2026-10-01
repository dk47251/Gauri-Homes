import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { ACCESS, SESSION_COOKIE, SESSION_TTL_MS, USER_STATUS } from "./constants";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Secure cookies need HTTPS. They are on in production unless COOKIE_SECURE=false
 * (e.g. when the app is served over plain HTTP on a local network).
 */
const secureCookies = () => process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";

/** Creates a DB session and sets the session cookie. Call only from Server Actions / Route Handlers. */
export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const userAgent = ((await headers()).get("user-agent") ?? "").slice(0, 255);

  await prisma.session.create({ data: { id: hashToken(token), userId, expiresAt, userAgent } });
  // Opportunistically clean up expired sessions.
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Deletes the current DB session and clears the cookie. */
export async function deleteSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

export type CurrentUser = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  isSystemAdmin: boolean;
  /** True when the user may create, edit or delete (READ_WRITE access or the system administrator). */
  canWrite: boolean;
};

/** Returns the logged-in user, or null. Memoised per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    select: {
      expiresAt: true,
      user: { select: { id: true, email: true, name: true, role: true, status: true, access: true, isSystemAdmin: true } },
    },
  });
  // A user who is rejected/disabled after logging in loses access immediately.
  if (!session || session.expiresAt < new Date() || session.user.status !== USER_STATUS.APPROVED) return null;
  const { id, email, name, role, access, isSystemAdmin } = session.user;
  return { id, email, name, role, isSystemAdmin, canWrite: isSystemAdmin || access === ACCESS.READ_WRITE };
});

/** Data Access Layer guard: redirects to /login when there is no valid session. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export const READ_ONLY_MESSAGE = "You have read-only access. Ask the administrator for Read & Write permission.";

/** Requires Read & Write access. Throws for read-only users (use inside Server Actions / Route Handlers). */
export async function requireWriteAccess() {
  const user = await requireUser();
  if (!user.canWrite) throw new Error(READ_ONLY_MESSAGE);
  return user;
}

/** Only the .env system administrator may manage users (approve, roles, access, delete). */
export async function requireSystemAdmin() {
  const user = await requireUser();
  if (!user.isSystemAdmin) throw new Error("Only the system administrator can manage users.");
  return user;
}

/** Page guard for administrator-only screens: everyone else is sent to the dashboard. */
export async function requireSystemAdminPage() {
  const user = await requireUser();
  if (!user.isSystemAdmin) redirect("/");
  return user;
}
