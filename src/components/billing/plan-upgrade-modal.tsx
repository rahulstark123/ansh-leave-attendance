"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Lock, Zap } from "lucide-react";
import { usePlanStore } from "@/stores/plan-store";

export function PlanUpgradeModal() {
  const router = useRouter();
  const modalOpen = usePlanStore((s) => s.modalOpen);
  const blockedFeature = usePlanStore((s) => s.blockedFeature);
  const closeModal = usePlanStore((s) => s.closeModal);

  const moduleName = blockedFeature?.moduleName ?? "This module";
  const message =
    blockedFeature?.message ??
    "This module is not included in your current plan.";

  const handleUpgrade = () => {
    closeModal();
    router.push("/settings/billing");
  };

  return (
    <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-transparent to-transparent px-6 pt-6 pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/20 mb-4">
            <Lock className="h-5 w-5" />
          </div>
          <DialogHeader className="text-left space-y-2">
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
              {moduleName}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">
              {message}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div className="rounded-xl border border-border/60 bg-slate-50/50 dark:bg-slate-900/30 p-4 text-xs text-slate-500 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200 mb-1">
              <Zap className="h-3.5 w-3.5 text-primary fill-primary" />
              Upgrade to Pro
            </div>
            Unlock Team Space, unlimited punch-ins, more teammates, shift
            rosters, custom leave rules, holiday calendars, and analytics.
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2.5">
            <Button
              variant="outline"
              className="modal-action-btn w-full sm:w-auto"
              onClick={closeModal}
            >
              Not now
            </Button>
            <Button
              className="modal-action-btn btn-primary w-full sm:w-auto border-0"
              onClick={handleUpgrade}
            >
              Upgrade your plan
              <ArrowUpRight className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
