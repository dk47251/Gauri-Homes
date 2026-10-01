/** Shared by proxy.ts (edge of the app) and the server-side session code. */
export const SESSION_COOKIE = "ghm_session";

export const ROLES = { ADMIN: "ADMIN", USER: "USER" } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const USER_STATUS = { PENDING: "PENDING", APPROVED: "APPROVED", REJECTED: "REJECTED" } as const;
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const ACCESS = { READ_WRITE: "READ_WRITE", READ_ONLY: "READ_ONLY" } as const;
export type Access = (typeof ACCESS)[keyof typeof ACCESS];

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Routes reachable without logging in. */
export const PUBLIC_ROUTES = ["/login", "/register"];

/** Only allow same-site relative paths as post-login redirect targets. */
export function safeNext(next: unknown, fallback = "/") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : fallback;
}
