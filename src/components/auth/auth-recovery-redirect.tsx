"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Handles Supabase recovery links that land on the homepage (or any page)
 * with hash tokens (#access_token=...&type=recovery).
 */
export function AuthRecoveryRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || pathname.startsWith("/auth/")) return;

    const hash = window.location.hash;
    if (!hash || !hash.includes("type=recovery")) return;

    handled.current = true;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    const finish = async () => {
      if (accessToken && refreshToken) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }

      window.history.replaceState(null, "", pathname);
      router.replace("/auth/reset-password?recovery=1");
    };

    void finish();
  }, [pathname, router]);

  return null;
}
