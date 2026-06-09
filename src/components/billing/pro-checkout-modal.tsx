"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/stores/plan-store";
import { useLeaveStore } from "@/stores/leave-store";
import { buildRazorpayPrefill } from "@/lib/billing/razorpay-prefill";
import { getCheckoutLogoUrl, openRazorpayCheckout } from "@/lib/billing/checkout-client";
import {
  computeCheckoutTotals,
  formatCheckoutPrice,
  type CheckoutFxPricing,
} from "@/lib/billing/checkout-pricing";
import type { BillingCycle } from "@/lib/billing/plans";

interface ProCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: number;
  minSeats?: number;
  canManageBilling?: boolean;
  onSuccess?: () => void | Promise<void>;
}

export function ProCheckoutModal({
  open,
  onOpenChange,
  workspaceId = 1,
  minSeats = 1,
  canManageBilling = true,
  onSuccess,
}: ProCheckoutModalProps) {
  const { currentUser, employees } = useLeaveStore();
  const fetchPlan = usePlanStore((s) => s.fetchPlan);

  const [fx, setFx] = useState<CheckoutFxPricing | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [seatsInput, setSeatsInput] = useState(String(Math.max(minSeats, employees.length || 1)));
  const [isPaying, setIsPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const defaultSeats = Math.max(minSeats, employees.length || 1);

  const [resolvedWorkspaceId, setResolvedWorkspaceId] = useState(workspaceId);
  const [resolvedCanManage, setResolvedCanManage] = useState(canManageBilling);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSeatsInput(String(defaultSeats));
    setErrorMsg("");
    setBillingCycle("monthly");
    setResolvedWorkspaceId(workspaceId);
    setResolvedCanManage(canManageBilling);
    setIsTrialActive(false);
    setTrialEndsAt(null);

    const token = sessionStorage.getItem("ansh_auth_token");
    Promise.all([
      fetch("/api/billing/fx", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/billing/status", { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(async ([fxRes, statusRes]) => {
        if (fxRes.ok) setFx(await fxRes.json());
        if (statusRes.ok) {
          const status = await statusRes.json();
          setResolvedWorkspaceId(status.workspaceId ?? workspaceId);
          setResolvedCanManage(Boolean(status.canManageBilling));
          setIsTrialActive(Boolean(status.isTrialActive));
          setTrialEndsAt(status.trialEndsAt ?? null);
        }
      })
      .catch(() => setFx(null));
  }, [open, defaultSeats, workspaceId, canManageBilling]);

  const seats = useMemo(() => {
    const parsed = parseInt(seatsInput, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 0;
    return parsed;
  }, [seatsInput]);

  const currency = fx?.chargeCurrency ?? "INR";
  const { perSeatMonthly, total } = useMemo(() => {
    if (!fx || seats < 1) {
      return { perSeatMonthly: currency === "USD" ? 2 : 199, total: 0 };
    }
    return computeCheckoutTotals(fx, seats, billingCycle);
  }, [fx, seats, billingCycle, currency]);

  const handleProceed = useCallback(async () => {
    if (!resolvedCanManage) {
      setErrorMsg("Only Admin, HR Manager, or Owner can manage billing.");
      return;
    }
    if (seats < minSeats) {
      setErrorMsg(`Seat count must be at least ${minSeats} for your current team.`);
      return;
    }

    setIsPaying(true);
    setErrorMsg("");

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      if (!token) throw new Error("Please sign in again.");

      const orderRes = await fetch("/api/billing/checkout/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          billingCycle,
          billingCountry: fx?.countryCode,
          seats,
        }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create payment order");
      }

      const { orderId, amount, currency: orderCurrency, keyId } = await orderRes.json();
      const { prefill, readonly } = buildRazorpayPrefill({
        name: currentUser?.name,
        email: currentUser?.email,
        phoneNumber: currentUser?.phoneNumber,
      });

      const displayCurrency = orderCurrency as "INR" | "USD";
      const cycleLabel = billingCycle === "yearly" ? "Yearly" : "Monthly";

      await openRazorpayCheckout({
        key: keyId,
        order_id: orderId,
        amount,
        currency: orderCurrency,
        name: "ANSH HR",
        description: `Pro Plan — ${cycleLabel} (${formatCheckoutPrice(perSeatMonthly, displayCurrency)}/user/mo × ${seats} users)`,
        image: getCheckoutLogoUrl(),
        prefill,
        readonly,
        theme: { color: "#0d9488" },
        handler: async (response) => {
          const verifyRes = await fetch("/api/billing/checkout/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              workspaceId: resolvedWorkspaceId,
            }),
          });

          if (!verifyRes.ok) {
            const data = await verifyRes.json().catch(() => ({}));
            throw new Error(data.error || "Payment verification failed");
          }

          await fetchPlan();
          await onSuccess?.();
          onOpenChange(false);
        },
      });
    } catch (err) {
      if (err instanceof Error && err.message === "Payment cancelled") {
        setErrorMsg("Payment was cancelled.");
      } else {
        setErrorMsg(err instanceof Error ? err.message : "Payment failed. Please try again.");
      }
    } finally {
      setIsPaying(false);
    }
  }, [
    resolvedCanManage,
    seats,
    minSeats,
    billingCycle,
    fx?.countryCode,
    currentUser,
    perSeatMonthly,
    resolvedWorkspaceId,
    fetchPlan,
    onSuccess,
    onOpenChange,
  ]);

  const cycleLabel = billingCycle === "yearly" ? "Yearly" : "Monthly";
  const billedLabel =
    billingCycle === "yearly"
      ? `billed yearly in ${currency}`
      : `billed monthly in ${currency}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0 border-border/60">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <DialogHeader className="text-left space-y-1 flex-1">
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                Upgrade to Pro Plan
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Secure checkout powered by Razorpay
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-slate-50/40 dark:bg-slate-900/30 px-4 py-3">
            <span className="text-xs font-semibold text-slate-500">Billing Cycle</span>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer",
                  billingCycle === "monthly"
                    ? "bg-primary/15 text-primary"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer",
                  billingCycle === "yearly"
                    ? "bg-primary/15 text-primary"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Yearly -19%
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="pro-checkout-seats"
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
            >
              Number of Seats / Users
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="pro-checkout-seats"
                type="number"
                min={minSeats}
                max={500}
                value={seatsInput}
                onChange={(e) => setSeatsInput(e.target.value)}
                className="h-11 pl-10 text-base font-semibold rounded-xl bg-slate-50/50 dark:bg-slate-900/50"
              />
            </div>
            {minSeats > 1 && (
              <p className="text-[10px] text-slate-400">
                Minimum {minSeats} seats for your current team size.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border/50 bg-slate-50/30 dark:bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Price per seat</span>
              <span className="font-bold text-slate-800 dark:text-white">
                {formatCheckoutPrice(perSeatMonthly, currency)}
                <span className="text-slate-400 font-semibold"> / mo</span>
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <span className="text-sm font-black text-slate-800 dark:text-white">
                Total ({seats > 0 ? seats : "—"} users)
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {seats > 0 ? formatCheckoutPrice(total, currency) : "—"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {cycleLabel} · {billedLabel}
            </p>
          </div>

          {isTrialActive && trialEndsAt && (
            <p className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              Your free trial runs until{" "}
              <span className="font-bold text-primary">
                {new Date(trialEndsAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              . Pro billing starts after the trial ends.
            </p>
          )}

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-500">{errorMsg}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 rounded-xl font-bold"
              onClick={() => onOpenChange(false)}
              disabled={isPaying}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 h-11 rounded-xl btn-primary border-0 font-black"
              onClick={handleProceed}
              disabled={isPaying || seats < minSeats || seats < 1}
            >
              {isPaying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Proceed to Pay ${seats > 0 ? formatCheckoutPrice(total, currency) : ""}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
