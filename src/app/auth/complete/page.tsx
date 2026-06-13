"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AuthCompletePage() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const finishSignIn = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          router.replace("/login?error=Could+not+complete+Google+sign-in");
          return;
        }

        sessionStorage.setItem("ansh_auth_session", "true");
        sessionStorage.setItem("ansh_auth_token", session.access_token);

        const isSignupFlow =
          new URLSearchParams(window.location.search).get("flow") === "signup";

        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok && !data.onboardingRequired) {
          router.replace("/login?error=Failed+to+load+profile");
          return;
        }

        // Signup page: mirror email signUp() — block already-registered accounts.
        if (isSignupFlow && data.employee && !data.onboardingRequired) {
          await supabase.auth.signOut();
          sessionStorage.removeItem("ansh_auth_session");
          sessionStorage.removeItem("ansh_auth_token");
          router.replace(
            "/login?error=This+Google+account+already+exists.+Please+sign+in+instead."
          );
          return;
        }

        if (data.onboardingRequired || isSignupFlow) {
          router.replace("/onboarding");
          return;
        }

        router.replace("/dashboard");
      } catch (err) {
        console.error("Auth complete failed:", err);
        router.replace("/login?error=Google+sign-in+failed");
      }
    };

    void finishSignIn();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Completing Google sign-in...</p>
      </div>
    </div>
  );
}
