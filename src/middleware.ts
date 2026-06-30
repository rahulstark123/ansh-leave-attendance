import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/adminpanel/auth";

/**
 * Supabase password-reset emails sometimes land on the site root
 * (redirect_to=https://hr.anshapps.com) with ?code= or ?token_hash=.
 * Forward those to /auth/confirm so the user reaches the reset page.
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Protect admin panel routes (except login)
  if (pathname.startsWith("/adminpanel") && pathname !== "/adminpanel/login") {
    const session = await getSessionFromRequest(request);
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/adminpanel/login";
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/auth/") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const isRecovery =
    Boolean(code) || (Boolean(tokenHash) && type === "recovery");

  if (!isRecovery) {
    return NextResponse.next();
  }

  const confirmUrl = request.nextUrl.clone();
  confirmUrl.pathname = "/auth/confirm";
  confirmUrl.search = "";

  if (code) confirmUrl.searchParams.set("code", code);
  if (tokenHash) confirmUrl.searchParams.set("token_hash", tokenHash);
  if (type) confirmUrl.searchParams.set("type", type);
  confirmUrl.searchParams.set("next", "/auth/reset-password");

  return NextResponse.redirect(confirmUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
