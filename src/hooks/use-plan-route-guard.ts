"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getFeatureForPath } from "@/lib/billing/features";
import { usePlanStore } from "@/stores/plan-store";

const SAFE_REDIRECT = "/dashboard";

export function usePlanRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const loaded = usePlanStore((s) => s.loaded);
  const hasProAccess = usePlanStore((s) => s.hasProAccess);
  const requestUpgrade = usePlanStore((s) => s.requestUpgrade);
  const lastBlockedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!loaded) return;

    const feature = getFeatureForPath(pathname);
    if (!feature || hasProAccess) {
      lastBlockedPath.current = null;
      return;
    }

    if (lastBlockedPath.current === pathname) return;
    lastBlockedPath.current = pathname;

    requestUpgrade(feature.id);
    if (pathname !== SAFE_REDIRECT) {
      router.replace(SAFE_REDIRECT);
    }
  }, [pathname, loaded, hasProAccess, requestUpgrade, router]);
}
