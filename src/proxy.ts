import { NextResponse, type NextRequest } from "next/server";
import { PUBLIC_ROUTES, SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Optimistic auth check: only looks at whether the session cookie exists (no DB access here).
 * The real verification happens in the Data Access Layer (requireUser / getCurrentUser).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (!hasSession && !isPublic) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Pages only — API routes return 401 themselves; static assets are skipped.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
