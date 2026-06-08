"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import {
  getFeatureForPath,
  getPlanFeature,
  type PlanFeatureId,
} from "@/lib/billing/features";
import { usePlanStore } from "@/stores/plan-store";

type GatedNavLinkProps = ComponentProps<typeof Link> & {
  featureId?: PlanFeatureId;
};

export function GatedNavLink({
  href,
  featureId,
  onClick,
  children,
  ...props
}: GatedNavLinkProps) {
  const hasProAccess = usePlanStore((s) => s.hasProAccess);
  const loaded = usePlanStore((s) => s.loaded);
  const requestUpgrade = usePlanStore((s) => s.requestUpgrade);

  const path = typeof href === "string" ? href : href.pathname || "";
  const feature = featureId ? getPlanFeature(featureId) : getFeatureForPath(path);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (loaded && feature && !hasProAccess) {
      e.preventDefault();
      requestUpgrade(feature.id);
      return;
    }
    onClick?.(e);
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
