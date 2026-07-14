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
  applyGstToMajor,
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
  const checkoutIntent = usePlanStore((s) => s.checkoutIntent);
  const storeSeatsCount = usePlanStore((s) => s.seatsCount);
  const isAddSeats = checkoutIntent === "add_seats";

  const [fx, setFx] = useState<CheckoutFxPricing | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [seatsInput, setSeatsInput] = useState(String(Math.max(minSeats, employees.length || 1)));
  const [additionalSeatsInput, setAdditionalSeatsInput] = useState("1");
  const [isPaying, setIsPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const defaultSeats = Math.max(minSeats, employees.length || 1);

  const [resolvedWorkspaceId, setResolvedWorkspaceId] = useState(workspaceId);
  const [resolvedCanManage, setResolvedCanManage] = useState(canManageBilling);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [hasScheduledPro, setHasScheduledPro] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [currentSeats, setCurrentSeats] = useState(storeSeatsCount);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [subscriptionStartsAt, setSubscriptionStartsAt] = useState<string | null>(null);
  const [activeBillingCycle, setActiveBillingCycle] = useState<BillingCycle>("monthly");
  const [quote, setQuote] = useState<{
    subtotal: number;
    gst: number;
    gstRate: number;
    total: number;
    currency: "INR" | "USD";
    daysRemaining: number;
    periodDays: number;
    newTotalSeats: number;
  } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [existingSaathiCode, setExistingSaathiCode] = useState<string | null>(null);
  const [helpedBySaathi, setHelpedBySaathi] = useState(false);
  const [saathiCodeInput, setSaathiCodeInput] = useState("");
  const [isProActive, setIsProActive] = useState(false);
  const [willRenewNextPeriod, setWillRenewNextPeriod] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSeatsInput(String(defaultSeats));
    setAdditionalSeatsInput("1");
    setErrorMsg("");
    setBillingCycle("monthly");
    setResolvedWorkspaceId(workspaceId);
    setResolvedCanManage(canManageBilling);
    setIsTrialActive(false);
    setHasScheduledPro(false);
    setTrialEndsAt(null);
    setQuote(null);
    setExistingSaathiCode(null);
    setHelpedBySaathi(false);
    setSaathiCodeInput("");
    setIsProActive(false);
    setWillRenewNextPeriod(false);

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
          setHasScheduledPro(Boolean(status.hasScheduledPro));
          setTrialEndsAt(status.trialEndsAt ?? null);
          setCurrentSeats(status.seatsCount ?? status.maxUsers ?? storeSeatsCount);
          setPlanExpiresAt(status.planExpiresAt ?? null);
          setSubscriptionStartsAt(
            status.subscriptionStartsAt ?? status.planExpiresAt ?? null
          );
          setIsProActive(Boolean(status.isProActive));
          setWillRenewNextPeriod(
            Boolean(status.isProActive) && checkoutIntent === "upgrade"
          );
          if (status.billingCycle === "yearly" || status.billingCycle === "monthly") {
            setActiveBillingCycle(status.billingCycle);
            setBillingCycle(status.billingCycle);
          }
          const code =
            typeof status.saathiCode === "string" && status.saathiCode.trim()
              ? status.saathiCode.trim().toUpperCase()
              : null;
          setExistingSaathiCode(code);
          if (code) {
            setHelpedBySaathi(true);
            setSaathiCodeInput(code);
          }
        }
      })
      .catch(() => setFx(null));
  }, [open, defaultSeats, workspaceId, canManageBilling, storeSeatsCount, checkoutIntent]);

  const seats = useMemo(() => {
    const parsed = parseInt(seatsInput, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 0;
    return parsed;
  }, [seatsInput]);

  const additionalSeats = useMemo(() => {
    const parsed = parseInt(additionalSeatsInput, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 0;
    return parsed;
  }, [additionalSeatsInput]);

  const currency = fx?.chargeCurrency ?? "INR";
  const totals = useMemo(() => {
    if (!fx || seats < 1) {
      return {
        perSeatMonthly: currency === "USD" ? 2 : 199,
        subtotal: 0,
        gst: 0,
        gstRate: 0,
        total: 0,
      };
    }
    return computeCheckoutTotals(fx, seats, billingCycle);
  }, [fx, seats, billingCycle, currency]);

  // Client-side prorated estimate for add-seats preview (with GST)
  useEffect(() => {
    if (!open || !isAddSeats || !fx || additionalSeats < 1 || !planExpiresAt) {
      setQuote(null);
      return;
    }

    setQuoteLoading(true);
    const end = new Date(planExpiresAt).getTime();
    let start = subscriptionStartsAt
      ? new Date(subscriptionStartsAt).getTime()
      : NaN;
    if (!Number.isFinite(start) || start >= end) {
      // Infer period start from billing cycle when dates were missing
      const inferred = new Date(end);
      if (activeBillingCycle === "yearly") {
        inferred.setFullYear(inferred.getFullYear() - 1);
      } else {
        inferred.setMonth(inferred.getMonth() - 1);
      }
      start = inferred.getTime();
    }

    const now = Date.now();
    const periodMs = Math.max(end - start, 86400000);
    const remainingMs = Math.max(end - now, 0);
    const fraction = Math.min(1, remainingMs / periodMs);
    const daysRemaining = Math.max(1, Math.ceil(remainingMs / 86400000));
    const periodDays = Math.max(1, Math.round(periodMs / 86400000));

    const fullTotals = computeCheckoutTotals(fx, additionalSeats, activeBillingCycle);
    const proratedSubtotal = Math.max(
      currency === "INR" ? 1 : 0.01,
      Math.round(fullTotals.subtotal * fraction * (currency === "INR" ? 1 : 100)) /
        (currency === "INR" ? 1 : 100)
    );
    const withTax = applyGstToMajor(
      currency === "INR" ? Math.round(proratedSubtotal) : proratedSubtotal,
      currency
    );

    setQuote({
      ...withTax,
      currency,
      daysRemaining,
      periodDays,
      newTotalSeats: currentSeats + additionalSeats,
    });
    setQuoteLoading(false);
  }, [
    open,
    isAddSeats,
    fx,
    additionalSeats,
    planExpiresAt,
    subscriptionStartsAt,
    activeBillingCycle,
    currency,
    currentSeats,
  ]);

  const handleProceed = useCallback(async () => {
    if (!resolvedCanManage) {
      setErrorMsg("Only Admin, HR Manager, or Owner can manage billing.");
      return;
    }

    if (isAddSeats) {
      if (additionalSeats < 1) {
        setErrorMsg("Enter at least 1 additional seat.");
        return;
      }
    } else {
      if (hasScheduledPro && !willRenewNextPeriod) {
        setErrorMsg("Pro is already purchased and will start when your current period ends.");
        return;
      }
      if (seats < minSeats) {
        setErrorMsg(`Seat count must be at least ${minSeats} for your current team.`);
        return;
      }
    }

    const saathiToSend = existingSaathiCode
      ? existingSaathiCode
      : helpedBySaathi
        ? saathiCodeInput.trim().toUpperCase()
        : "";

    if (helpedBySaathi && !existingSaathiCode && !saathiToSend) {
      setErrorMsg("Please enter your ANSH Saathi code, or turn the toggle off.");
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
        body: JSON.stringify(
          isAddSeats
            ? {
                intent: "add_seats",
                additionalSeats,
                billingCountry: fx?.countryCode,
                ...(saathiToSend ? { saathiCode: saathiToSend } : {}),
              }
            : {
                intent: "upgrade",
                billingCycle,
                billingCountry: fx?.countryCode,
                seats,
                ...(saathiToSend ? { saathiCode: saathiToSend } : {}),
              }
        ),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create payment order");
      }

      const order = await orderRes.json();
      const { orderId, amount, currency: orderCurrency, keyId } = order;
      const { prefill, readonly } = buildRazorpayPrefill({
        name: currentUser?.name,
        email: currentUser?.email,
        phoneNumber: currentUser?.phoneNumber,
      });

      const displayCurrency = orderCurrency as "INR" | "USD";
      const description = isAddSeats
        ? `Add ${additionalSeats} seat${additionalSeats === 1 ? "" : "s"} (prorated${order.gstAmount ? " + GST" : ""})`
        : `Pro Plan — ${billingCycle === "yearly" ? "Yearly" : "Monthly"} (${formatCheckoutPrice(totals.perSeatMonthly, displayCurrency)}/user/mo × ${seats} users${order.gstAmount ? " + 18% GST" : ""})`;

      await openRazorpayCheckout({
        key: keyId,
        order_id: orderId,
        amount,
        currency: orderCurrency,
        name: "ANSH HR",
        description,
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
    isAddSeats,
    hasScheduledPro,
    willRenewNextPeriod,
    seats,
    additionalSeats,
    minSeats,
    billingCycle,
    fx?.countryCode,
    currentUser,
    totals.perSeatMonthly,
    resolvedWorkspaceId,
    fetchPlan,
    onSuccess,
    onOpenChange,
    existingSaathiCode,
    helpedBySaathi,
    saathiCodeInput,
  ]);

  const cycleLabel = (isAddSeats ? activeBillingCycle : billingCycle) === "yearly" ? "Yearly" : "Monthly";
  const displayTotal = isAddSeats ? quote?.total ?? 0 : totals.total;
  const payLabel =
    displayTotal > 0
      ? `Proceed to Pay ${formatCheckoutPrice(displayTotal, currency)}`
      : "Proceed to Pay";

  const hasExistingSaathi = Boolean(existingSaathiCode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0 border-border/60 max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/25">
              {isAddSeats ? <Users className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </div>
            <DialogHeader className="text-left space-y-1 flex-1">
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                {isAddSeats
                  ? "Add seats to Pro"
                  : willRenewNextPeriod
                    ? "Renew Pro plan"
                    : "Upgrade to Pro Plan"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {isAddSeats
                  ? "Only the remaining days in your billing period are charged"
                  : willRenewNextPeriod
                    ? "Paid now — new period starts when your current plan expires"
                    : "Secure checkout powered by Razorpay"}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {!isAddSeats && (
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
          )}

          {isAddSeats ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-border/50 bg-slate-50/40 dark:bg-slate-900/30 px-4 py-3 flex justify-between text-xs">
                <span className="text-slate-500">Current seats</span>
                <span className="font-bold text-slate-800 dark:text-white">{currentSeats}</span>
              </div>
              <label
                htmlFor="pro-checkout-add-seats"
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
              >
                Additional Seats
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="pro-checkout-add-seats"
                  type="number"
                  min={1}
                  max={500}
                  value={additionalSeatsInput}
                  onChange={(e) => setAdditionalSeatsInput(e.target.value)}
                  className="h-11 pl-10 text-base font-semibold rounded-xl bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                New total after purchase:{" "}
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {currentSeats + Math.max(additionalSeats, 0)} seats
                </span>
                {" · "}
                {cycleLabel} plan
              </p>
            </div>
          ) : (
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
          )}

          {/* Helped by ANSH Saathi */}
          <div className="rounded-xl border border-border/50 bg-slate-50/40 dark:bg-slate-900/30 px-4 py-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  Helped by ANSH Saathi
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {hasExistingSaathi
                    ? "Saved on your workspace"
                    : "Optional referral code from your Saathi"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={helpedBySaathi}
                onClick={() => {
                  setHelpedBySaathi((prev) => {
                    const next = !prev;
                    // Clear only a newly typed code; keep workspace-saved code for when toggle is on again
                    if (!next && !hasExistingSaathi) {
                      setSaathiCodeInput("");
                    }
                    return next;
                  });
                }}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer",
                  helpedBySaathi ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    helpedBySaathi && "translate-x-5"
                  )}
                />
              </button>
            </div>

            {helpedBySaathi && (
              <div className="space-y-1.5">
                <label
                  htmlFor="checkout-saathi-code"
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                >
                  Saathi code
                </label>
                <Input
                  id="checkout-saathi-code"
                  type="text"
                  value={hasExistingSaathi ? existingSaathiCode ?? "" : saathiCodeInput}
                  onChange={(e) => {
                    if (hasExistingSaathi) return;
                    setSaathiCodeInput(e.target.value.toUpperCase());
                  }}
                  readOnly={hasExistingSaathi}
                  placeholder="e.g. SAATHI-00001"
                  className={cn(
                    "h-10 uppercase text-sm font-semibold rounded-xl",
                    hasExistingSaathi && "bg-slate-100 dark:bg-slate-800 opacity-90"
                  )}
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/50 bg-slate-50/30 dark:bg-slate-900/40 p-4 space-y-2.5">
            {isAddSeats ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Prorated subtotal</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {quoteLoading
                      ? "…"
                      : quote
                        ? formatCheckoutPrice(quote.subtotal, quote.currency)
                        : "—"}
                  </span>
                </div>
                {quote && quote.gst > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      GST ({Math.round(quote.gstRate * 100)}%)
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {formatCheckoutPrice(quote.gst, quote.currency)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Remaining period</span>
                  <span>
                    {quoteLoading
                      ? "…"
                      : quote
                        ? `${quote.daysRemaining} of ${quote.periodDays} days`
                        : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <span className="text-sm font-black text-slate-800 dark:text-white">
                    Due today
                  </span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {quote ? formatCheckoutPrice(quote.total, quote.currency) : "—"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Price per seat</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {formatCheckoutPrice(totals.perSeatMonthly, currency)}
                    <span className="text-slate-400 font-semibold"> / mo</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Subtotal ({seats > 0 ? seats : "—"} users)
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {seats > 0 ? formatCheckoutPrice(totals.subtotal, currency) : "—"}
                  </span>
                </div>
                {totals.gst > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      GST ({Math.round(totals.gstRate * 100)}%)
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {formatCheckoutPrice(totals.gst, currency)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <span className="text-sm font-black text-slate-800 dark:text-white">
                    Total payable
                  </span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {seats > 0 ? formatCheckoutPrice(totals.total, currency) : "—"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {cycleLabel} · billed {billingCycle === "yearly" ? "yearly" : "monthly"} in{" "}
                  {currency}
                  {totals.gst > 0 ? " · incl. 18% GST" : ""}
                </p>
              </>
            )}
          </div>

          {!isAddSeats && willRenewNextPeriod && planExpiresAt ? (
            <p className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              You already have an active Pro plan. This purchase will be queued and
              start on{" "}
              <span className="font-bold text-primary">
                {new Date(planExpiresAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>{" "}
              when your current period ends.
            </p>
          ) : !isAddSeats && hasScheduledPro ? (
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-[11px] leading-relaxed text-emerald-600 dark:text-emerald-400">
              Pro is already scheduled. Paid billing starts when your current period ends.
            </p>
          ) : !isAddSeats && isTrialActive && trialEndsAt ? (
            <p className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              Your free trial runs until{" "}
              <span className="font-bold text-primary">
                {new Date(trialEndsAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              . Pay now to secure Pro — subscription billing starts after the trial ends.
            </p>
          ) : null}

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
              disabled={
                isPaying ||
                (isAddSeats
                  ? additionalSeats < 1
                  : seats < minSeats ||
                    seats < 1 ||
                    (hasScheduledPro && !willRenewNextPeriod))
              }
            >
              {isPaying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                payLabel
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
