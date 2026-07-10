import { NextResponse } from "next/server";
import { verifyMobileSsoToken } from "@/lib/mobile-sso";

/**
 * Redeem a mobile SSO handoff token for Supabase session tokens.
 * Called by /auth/mobile-login in the browser.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const payload = await verifyMobileSsoToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired SSO token" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken || null,
      userId: payload.userId,
    });
  } catch (error) {
    console.error("API /api/auth/mobile-sso/consume POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
