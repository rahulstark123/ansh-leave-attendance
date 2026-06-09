"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { usePlanStore } from "@/stores/plan-store";

export function TrialBanner() {
  const isTrialActive = usePlanStore((s) => s.isTrialActive);
  const hasScheduledPro = usePlanStore((s) => s.hasScheduledPro);
  const scheduledProStartsAt = usePlanStore((s) => s.scheduledProStartsAt);
  const trialDaysRemaining = usePlanStore((s) => s.trialDaysRemaining);
  const [dismissed, setDismissed] = useState(false);

  if (!isTrialActive || dismissed) return null;

  const daysLabel =
    trialDaysRemaining === 1
      ? "1 day left"
      : `${trialDaysRemaining ?? 14} days left`;

  const scheduledLabel = scheduledProStartsAt
    ? new Date(scheduledProStartsAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="border-b border-primary/20 bg-primary/5 px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            <span className="font-black text-primary">Pro trial active</span>
            <span className="text-slate-500 dark:text-slate-400">
              {" "}
              — all features unlocked · {daysLabel}
              {hasScheduledPro && scheduledLabel
                ? ` · Pro subscription starts ${scheduledLabel}`
                : ""}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/settings/billing"
            className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
          >
            View plans
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Dismiss trial banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
