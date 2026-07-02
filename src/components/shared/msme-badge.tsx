import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRUST_COMPLIANCE_HREF } from "@/components/shared/trust-compliance";

type MsmeBadgeProps = {
  href?: string;
  className?: string;
  variant?: "theme" | "landing";
};

export function MsmeBadge({
  href = TRUST_COMPLIANCE_HREF,
  className,
  variant = "theme",
}: MsmeBadgeProps) {
  const isLanding = variant === "landing";

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors",
        isLanding
          ? "border-white/10 bg-zinc-900/50 hover:border-violet-500/20 hover:bg-violet-500/5"
          : "border-zinc-200/80 bg-zinc-50/80 hover:border-violet-500/25 hover:bg-violet-500/5 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-violet-500/20 dark:hover:bg-violet-500/5",
        className
      )}
      aria-label="View Trust and Compliance — MSME Registered Enterprise"
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
          "border-violet-500/20 bg-violet-500/10 text-violet-500",
          "dark:text-violet-400"
        )}
      >
        <BadgeCheck className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 text-left leading-tight">
        <p
          className={cn(
            "text-[11px] font-semibold",
            isLanding
              ? "text-slate-400 group-hover:text-slate-300"
              : "text-zinc-700 group-hover:text-zinc-900 dark:text-slate-300 dark:group-hover:text-white"
          )}
        >
          MSME Registered Enterprise
        </p>
        <p className="text-[10px] text-slate-500">Government of India Udyam Registered</p>
      </div>
    </Link>
  );
}
