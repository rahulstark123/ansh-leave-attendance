"use client";

import Link from "next/link";
import { GatedNavLink } from "@/components/billing/gated-nav-link";
import type { PlanFeatureId } from "@/lib/billing/features";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  getSectionFromPath,
  getSubNavForSection,
  getSectionMeta,
} from "@/config/navigation";
import { Badge } from "@/components/ui/badge";
import { useLeaveStore } from "@/stores/leave-store";

export function SubSidebar() {
  const pathname = usePathname();
  const sectionId = getSectionFromPath(pathname);
  const subNav = getSubNavForSection(sectionId);
  const section = getSectionMeta(sectionId);
  
  // Dynamic badge from store for pending approvals
  const leaves = useLeaveStore((s) => s.leaves);
  const pendingCount = leaves.filter(l => l.status === "Pending").length;

  if (!subNav?.length || !section) return null;

  const gatedSubNavFeatures: Record<string, PlanFeatureId> = {
    holidays: "holidays",
    policies: "policies",
    "leave-settings": "leave-categories",
    "attendance-settings": "shift-roster",
  };

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-border/50 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="px-4 pb-4 pt-6">
        <div className="flex items-center gap-2">
          <section.icon
            className="h-4 w-4 text-primary"
            aria-hidden
          />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
            {section.label}
          </p>
        </div>
        <p className="mt-1 text-xs font-medium text-slate-400">
          Views & filters
        </p>
      </div>
      <nav className="flex-1 space-y-1 px-3 pb-4">
        {subNav.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" &&
              pathname.startsWith(item.href + "/") &&
              !subNav.some((other) => other.id !== item.id && pathname.startsWith(other.href)));
          const Icon = item.icon;
          
          // Display actual count of pending requests for the approvals tab
          const displayBadge = item.id === "approvals" ? (pendingCount > 0 ? String(pendingCount) : undefined) : item.badge;

          const featureId = gatedSubNavFeatures[item.id];
          const isDeleteAccount = item.id === "delete-account";
          
          const itemClassName = cn(
            "flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200",
            isActive
              ? isDeleteAccount
                ? "bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20 shadow-sm dark:bg-rose-950/20 dark:text-rose-400 dark:ring-rose-500/30"
                : "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
              : isDeleteAccount
                ? "text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/20 dark:hover:text-rose-350"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          );
          
          const itemContent = (
            <>
              <span className="flex items-center gap-2.5">
                <Icon 
                  className={cn(
                    "h-4 w-4 shrink-0 transition-opacity", 
                    isActive ? "opacity-100" : "opacity-60",
                    isDeleteAccount && "opacity-100"
                  )} 
                  aria-hidden 
                />
                {item.label}
              </span>
              {displayBadge && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-5 border-0 px-2 text-[10px] font-bold rounded-full",
                    isActive ? "bg-primary text-primary-foreground" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                  )}
                >
                  {displayBadge}
                </Badge>
              )}
            </>
          );

          if (featureId) {
            return (
              <GatedNavLink
                key={item.id}
                href={item.href}
                featureId={featureId}
                className={itemClassName}
              >
                {itemContent}
              </GatedNavLink>
            );
          }

          return (
            <Link key={item.id} href={item.href} className={itemClassName}>
              {itemContent}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
