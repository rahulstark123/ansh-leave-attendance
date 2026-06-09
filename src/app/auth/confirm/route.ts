import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Handles Supabase email links (password recovery, magic link, etc.).
 * After a successful exchange, sends the user to the reset password screen.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextPath = searchParams.get("next") || "/auth/reset-password";

  const supabase = await createClient();
  const safeNext = nextPath.startsWith("/") ? nextPath : "/auth/reset-password";

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/forgot-password?error=${encodeURIComponent(error.message)}`
      );
    }
    return NextResponse.redirect(`${origin}${safeNext}?recovery=1`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) {
      return NextResponse.redirect(
        `${origin}/forgot-password?error=${encodeURIComponent(error.message)}`
      );
    }
    return NextResponse.redirect(`${origin}${safeNext}?recovery=1`);
  }

  return NextResponse.redirect(
    `${origin}/forgot-password?error=${encodeURIComponent("Invalid or expired reset link")}`
  );
}
