import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { createMobileSsoToken } from "@/lib/mobile-sso";

/**
 * Mobile → Web SSO handoff.
 * Mobile calls this with its Bearer access token and receives a short-lived
 * one-time URL token to open in the browser.
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json({ error: "Missing access token" }, { status: 401 });
    }

    let refreshToken: string | undefined;
    try {
      const body = await req.json();
      if (typeof body?.refreshToken === "string" && body.refreshToken.trim()) {
        refreshToken = body.refreshToken.trim();
      } else if (typeof body?.refresh_token === "string" && body.refresh_token.trim()) {
        refreshToken = body.refresh_token.trim();
      }
    } catch {
      // Body is optional
    }

    const { token, expiresIn } = await createMobileSsoToken({
      userId: user.id,
      accessToken,
      refreshToken,
    });

    return NextResponse.json({ token, expiresIn });
  } catch (error) {
    console.error("API /api/auth/mobile-sso POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
