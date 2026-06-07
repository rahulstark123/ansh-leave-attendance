"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const completeOAuthSignIn = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const oauthError = params.get("error_description") || params.get("error");

        if (oauthError) {
          router.replace(`/login?error=${encodeURIComponent(oauthError)}`);
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            router.replace(`/login?error=${encodeURIComponent(error.message)}`);
            return;
          }
        }

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

        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok && !data.onboardingRequired) {
          router.replace("/login?error=Failed+to+load+profile");
          return;
        }

        router.replace(data.onboardingRequired ? "/onboarding" : "/dashboard");
      } catch (err) {
        console.error("OAuth callback failed:", err);
        router.replace("/login?error=Google+sign-in+failed");
      }
    };

    void completeOAuthSignIn();
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
