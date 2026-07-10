"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function sanitizeRedirect(redirect: string | null): string {
  const fallback = "/settings/billing";
  if (!redirect) return fallback;
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return fallback;
  if (redirect.includes("://")) return fallback;
  return redirect;
}

function MobileLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const finish = async () => {
      const token = searchParams.get("token");
      const redirectTo = sanitizeRedirect(searchParams.get("redirect"));

      if (!token) {
        router.replace("/login?error=Missing+mobile+login+token");
        return;
      }

      try {
        const res = await fetch("/api/auth/mobile-sso/consume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.access_token) {
          router.replace("/login?error=Mobile+login+link+expired.+Please+try+again.");
          return;
        }

        sessionStorage.setItem("ansh_auth_session", "true");
        sessionStorage.setItem("ansh_auth_token", data.access_token);

        if (data.refresh_token) {
          try {
            const supabase = createClient();
            await supabase.auth.setSession({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            });
          } catch (err) {
            console.warn("Mobile SSO setSession skipped:", err);
          }
        }

        // Confirm profile exists / onboarding gate
        const meRes = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        const meData = await meRes.json().catch(() => ({}));

        if (meData.onboardingRequired) {
          router.replace("/onboarding");
          return;
        }

        if (!meRes.ok && !meData.onboardingRequired) {
          router.replace("/login?error=Failed+to+load+profile");
          return;
        }

        router.replace(redirectTo);
      } catch (err) {
        console.error("Mobile SSO login failed:", err);
        router.replace("/login?error=Mobile+login+failed");
      }
    };

    void finish();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Signing you in from the app…</p>
      </div>
    </div>
  );
}

export default function MobileLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <MobileLoginInner />
    </Suspense>
  );
}
