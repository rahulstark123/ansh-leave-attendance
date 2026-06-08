"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLeaveStore } from "@/stores/leave-store";
import {
  Loader2,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  HelpCircle,
  Receipt,
  Zap,
  Shield,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildRazorpayPrefill } from "@/lib/billing/razorpay-prefill";
import { getCheckoutLogoUrl, openRazorpayCheckout } from "@/lib/billing/checkout-client";
import { usePlanStore } from "@/stores/plan-store";

interface BillingInvoice {
  id: string;
  date: string;
  amount: string;
  status: string;
  description: string;
}

interface BillingStatus {
  workspaceId: number;
  plan: string;
  planName: string;
  maxUsers: number;
  planExpiresAt: string | null;
  trialEndsAt: string | null;
  isTrialActive: boolean;
  trialDaysRemaining: number | null;
  billingCycle: string | null;
  price: number;
  currency: string;
  employeeCount: number;
  canManageBilling: boolean;
  invoices: BillingInvoice[];
}

interface FxPricing {
  chargeCurrency: "INR" | "USD";
  monthlyPriceMajor: number;
  yearlyMonthlyEquivalentMajor: number;
  yearlyTotalMajor: number;
  disclaimer: string;
}

function formatPrice(amount: number, currency: string) {
  if (currency === "USD") {
    return `$${amount.toFixed(currency === "USD" && amount % 1 !== 0 ? 2 : 0)}`;
  }
  return `₹${Math.round(amount)}`;
}

function formatRenewalDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BillingSettingPage() {
  const { currentUser, employees, initialize } = useLeaveStore();
  const fetchPlan = usePlanStore((s) => s.fetchPlan);

  const [planName, setPlanName] = useState("ANSH HR Free Edition");
  const [plan, setPlan] = useState("free");
  const [maxUsers, setMaxUsers] = useState(5);
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const [billingCycle, setBillingCycle] = useState<string | null>(null);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [canManageBilling, setCanManageBilling] = useState(false);
  const [workspaceId, setWorkspaceId] = useState(1);
  const [fx, setFx] = useState<FxPricing | null>(null);
  const [fetching, setFetching] = useState(true);

  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadBilling = useCallback(async () => {
    const token = sessionStorage.getItem("ansh_auth_token");
    const [statusRes, fxRes] = await Promise.all([
      fetch("/api/billing/status", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/billing/fx", { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    if (statusRes.ok) {
      const data: BillingStatus = await statusRes.json();
      setPlan(data.plan);
      setPlanName(data.planName);
      setMaxUsers(data.maxUsers);
      setPrice(data.price);
      setCurrency(data.currency);
      setBillingCycle(data.billingCycle);
      setPlanExpiresAt(data.planExpiresAt);
      setIsTrialActive(Boolean(data.isTrialActive));
      setTrialEndsAt(data.trialEndsAt ?? null);
      setTrialDaysRemaining(data.trialDaysRemaining ?? null);
      setInvoices(data.invoices);
      setCanManageBilling(data.canManageBilling);
      setWorkspaceId(data.workspaceId);
    }

    if (fxRes.ok) {
      setFx(await fxRes.json());
    }
  }, []);

  useEffect(() => {
    loadBilling()
      .catch((err) => console.error("Failed to load billing:", err))
      .finally(() => setFetching(false));
  }, [loadBilling]);

  const handleDowngrade = async () => {
    setIsUpgrading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/billing/downgrade", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to downgrade plan");
      }

      const data = await res.json();
      setPlan(data.plan);
      setPlanName(data.planName);
      setMaxUsers(data.maxUsers);
      setPrice(0);
      setBillingCycle(null);
      setPlanExpiresAt(null);
      await Promise.all([initialize(), loadBilling(), fetchPlan()]);
      setSuccessMsg(`Plan updated to ${data.planName}`);
      setIsPlansModalOpen(false);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to downgrade plan.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleProceedToPay = async () => {
    if (!canManageBilling) {
      setErrorMsg("Only Admin, HR Manager, or Owner can manage billing.");
      return;
    }

    setIsUpgrading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      if (!token) throw new Error("Please sign in again.");

      const cycle = isYearly ? "yearly" : "monthly";
      const orderRes = await fetch("/api/billing/checkout/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ billingCycle: cycle }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create payment order");
      }

      const { orderId, amount, currency: orderCurrency, keyId, seats } = await orderRes.json();
      const { prefill, readonly } = buildRazorpayPrefill({
        name: currentUser?.name,
        email: currentUser?.email,
        phoneNumber: currentUser?.phoneNumber,
      });

      const displayCurrency = orderCurrency as "INR" | "USD";
      const monthlyDisplay = isYearly
        ? fx?.yearlyMonthlyEquivalentMajor ?? price
        : fx?.monthlyPriceMajor ?? price;

      await openRazorpayCheckout({
        key: keyId,
        order_id: orderId,
        amount,
        currency: orderCurrency,
        name: "ANSH HR",
        description: `Pro Plan — ${isYearly ? "Yearly" : "Monthly"} (${formatPrice(monthlyDisplay, displayCurrency)}/user/mo × ${seats ?? 1} users)`,
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
              workspaceId,
            }),
          });

          if (!verifyRes.ok) {
            const data = await verifyRes.json().catch(() => ({}));
            throw new Error(data.error || "Payment verification failed");
          }

          const verified = await verifyRes.json();
          setPlan(verified.plan);
          setPlanName(verified.planName);
          setMaxUsers(verified.maxUsers);
          setBillingCycle(verified.billingCycle);
          setPlanExpiresAt(verified.expiresAt);
          await Promise.all([initialize(), loadBilling(), fetchPlan()]);
          setSuccessMsg("Payment successful! Your workspace is now on Pro.");
          setIsPlansModalOpen(false);
          setTimeout(() => setSuccessMsg(""), 5000);
        },
      });
    } catch (err) {
      if (err instanceof Error && err.message === "Payment cancelled") {
        setErrorMsg("Payment was cancelled.");
      } else {
        console.error(err);
        setErrorMsg(err instanceof Error ? err.message : "Payment failed. Please try again.");
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  const handlePlanChange = async (target: "Free" | "Pro") => {
    if (target === "Free") {
      await handleDowngrade();
    } else {
      await handleProceedToPay();
    }
  };

  if (fetching) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Loading billing profile...
          </p>
        </div>
      </div>
    );
  }

  const activeEmployeeCount = employees.length || 1;
  const utilizationPercentage = Math.round((activeEmployeeCount / maxUsers) * 100);
  const hasPaidPro = plan === "pro";
  const isPro = hasPaidPro || isTrialActive;
  const displayCurrency = fx?.chargeCurrency || currency;
  const monthlyListPrice = fx?.monthlyPriceMajor ?? 199;
  const yearlyListPrice = fx?.yearlyMonthlyEquivalentMajor ?? 161;
  const priceSymbol = displayCurrency === "USD" ? "$" : "₹";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Financial Settings"
        title="Billing Page"
        description="Review your active ANSH HR subscription plan, check seat allocation thresholds, and view payment invoices."
        action={{
          label: "Check our Plans",
          onClick: () => setIsPlansModalOpen(true)
        }}
      />

      {successMsg && (
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-xs font-bold text-emerald-400 flex items-center gap-2 max-w-xl animate-in fade-in duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 text-xs font-bold text-rose-400 max-w-xl animate-in fade-in duration-300">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active plan card */}
          <Card className="crm-card overflow-hidden relative">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/5 blur-3xl -z-10" />
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Current Plan
                </CardTitle>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mt-1">
                  {planName}
                </h3>
              </div>
              <div className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border",
                isTrialActive
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : isPro
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-slate-500/10 border-slate-500/20 text-slate-400"
              )}>
                <ShieldCheck className="h-3.5 w-3.5" />
                {isTrialActive
                  ? `Trial · ${trialDaysRemaining ?? 14}d left`
                  : isPro
                    ? "Active"
                    : "Free"}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pricing Rate
                  </p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                    {formatPrice(price, currency)}<span className="text-xs font-semibold text-slate-400">/mo</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Billing Cycle
                  </p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1.5 text-capitalize">
                    {isPro ? (billingCycle === "yearly" ? "Yearly" : "Monthly") : "Free"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Next Renewal Date
                  </p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1.5">
                    {isTrialActive
                      ? formatRenewalDate(trialEndsAt)
                      : formatRenewalDate(planExpiresAt)}
                  </p>
                </div>
              </div>

              {/* Seat allocation utilization */}
              <div className="space-y-2 border-t border-border/40 pt-6">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-500">Seat Utilization</span>
                  <span className="text-slate-700 dark:text-slate-350">
                    {activeEmployeeCount} of {maxUsers} slots used ({utilizationPercentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, utilizationPercentage)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Your plan supports up to {maxUsers} registered employee directory records. Check available plans above to change seat limits.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice History */}
          <Card className="crm-card">
            <CardHeader className="flex flex-row items-center gap-2">
              <Receipt className="h-4.5 w-4.5 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Invoice History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/40 text-slate-400 uppercase text-[9px] font-bold tracking-wider">
                      <th className="pb-3 font-bold">Invoice ID</th>
                      <th className="pb-3 font-bold">Billing Date</th>
                      <th className="pb-3 font-bold">Description</th>
                      <th className="pb-3 font-bold">Amount</th>
                      <th className="pb-3 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          No invoices yet. Upgrade to Pro to see payment history here.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="text-slate-700 dark:text-slate-350">
                          <td className="py-3.5 font-bold text-slate-800 dark:text-white">{inv.id}</td>
                          <td className="py-3.5">{inv.date}</td>
                          <td className="py-3.5 text-slate-500">{inv.description}</td>
                          <td className="py-3.5 font-bold">{inv.amount}</td>
                          <td className="py-3.5 text-right">
                            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side pricing tier overview */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="crm-card">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Available Tiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Free Trial */}
              <div className={cn(
                "p-4 rounded-2xl border space-y-2 relative transition-all duration-300",
                !isPro
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/40 bg-slate-50/30 dark:bg-slate-900/10 opacity-70 hover:opacity-100"
              )}>
                {!isPro && (
                  <div className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[8px] font-black text-primary-foreground uppercase tracking-wider">
                    Current
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">Free</span>
                  <span className="font-black text-slate-800 dark:text-white">₹0</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Core leave + attendance for small teams — 3 teammates, 50 punch-ins/month.
                </p>
              </div>

              {/* Pro Edition */}
              <div className={cn(
                "p-4 rounded-2xl border space-y-2 relative transition-all duration-300",
                isPro
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/40 bg-slate-50/30 dark:bg-slate-900/10 opacity-70 hover:opacity-100"
              )}>
                {isPro && (
                  <div className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[8px] font-black text-primary-foreground uppercase tracking-wider">
                    Current
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-800 dark:text-white">Pro Edition</span>
                  <span className="font-black text-slate-900 dark:text-white">{priceSymbol}{monthlyListPrice}<span className="text-[10px] font-semibold text-slate-400">/user/mo</span></span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Advanced HR operations with configurable policies, approvals, and analytics for growing teams.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="crm-card bg-slate-50/20 dark:bg-slate-900/20 border-dashed">
            <CardContent className="pt-6 space-y-3 text-center">
              <HelpCircle className="h-8 w-8 text-slate-400 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Need Billing Assistance?</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                If you have questions about invoice details, custom setups, or payment channels, get in touch with our billing team.
              </p>
              <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider h-10 border-border/60 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Plans Modal Dialog */}
      <Dialog open={isPlansModalOpen} onOpenChange={setIsPlansModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto !overflow-x-hidden p-6 select-none scrollbar-none">
          <DialogHeader className="border-b border-border/40 pb-4 mb-6">
            <DialogTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-primary fill-primary" />
              Upgrade Subscription Plan
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Compare our plans and upgrade to unlock Team Space, unlimited punch-ins, and more teammates.
            </DialogDescription>
          </DialogHeader>

          {/* Monthly / Yearly Toggle */}
          <div className="flex justify-center items-center gap-3 mb-8">
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsYearly(false)}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  !isYearly
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setIsYearly(true)}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                  isYearly
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                <span>Yearly</span>
                <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                  -19%
                </span>
              </button>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Free Plan Card */}
            <div className={cn(
              "flex flex-col justify-between p-6 rounded-3xl border transition-all duration-300 relative bg-card",
              !isPro
                ? "border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/15"
                : "border-border hover:shadow-md"
            )}>
              {!isPro && (
                <div className="absolute top-4 right-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[8.5px] font-black text-emerald-500 uppercase tracking-wider">
                  Active
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center border border-border/40">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">PLAN</span>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white">Free</h4>
                  </div>
                </div>

                <div>
                  <p className="text-3xl font-black text-slate-800 dark:text-white">
                    ₹0
                  </p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1">Forever free · no credit card required.</p>
                </div>

                <div className="pt-2 border-t border-border/30">
                  <button
                    type="button"
                    disabled={!isPro || isUpgrading || !canManageBilling}
                    onClick={() => handlePlanChange("Free")}
                    className={cn(
                      "w-full text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl cursor-pointer transition-all",
                      !isPro
                        ? "bg-slate-100 dark:bg-slate-850 text-slate-400 cursor-not-allowed border border-border"
                        : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-sm"
                    )}
                  >
                    {!isPro ? "Current Plan" : "Downgrade to Free"}
                  </button>
                </div>

                <ul className="space-y-2.5 pt-4 text-[11px] text-slate-550 dark:text-slate-350">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Up to 3 teammates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>50 punch-ins per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Punch in/out attendance tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Default annual, sick, and casual leave</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Basic leave request and approvals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Employee directory and leave balances</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 dark:text-slate-550 italic">
                    <X className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
                    <span>No Team Space, custom shifts, leave categories, or holidays</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Plan Card */}
            <div className={cn(
              "flex flex-col justify-between p-6 rounded-3xl border transition-all duration-300 relative bg-card",
              isPro
                ? "border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/15"
                : "border-border hover:shadow-md"
            )}>
              {isPro ? (
                <div className="absolute top-4 right-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[8.5px] font-black text-emerald-500 uppercase tracking-wider">
                  Active
                </div>
              ) : (
                <div className="absolute -top-3 right-4 rounded-full bg-emerald-500 border border-emerald-600 px-2.5 py-0.5 text-[8px] font-black text-white uppercase tracking-widest shadow-md">
                  ★ Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <Zap className="h-5 w-5 fill-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">PLAN</span>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white">Pro</h4>
                  </div>
                </div>

                <div>
                  <p className="text-3xl font-black text-slate-800 dark:text-white">
                    {priceSymbol}{isYearly ? yearlyListPrice : monthlyListPrice}
                    <span className="text-xs font-semibold text-slate-400"> / user / month</span>
                  </p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1">
                    {isYearly
                      ? `${priceSymbol}${yearlyListPrice}/user/mo billed yearly (${priceSymbol}${fx?.yearlyTotalMajor ?? yearlyListPrice * 12}/user/year)`
                      : `${priceSymbol}${monthlyListPrice}/user/month`}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {isYearly ? "Switch to monthly anytime." : "Switch to yearly to save 19%."}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/30">
                  <button
                    type="button"
                    disabled={hasPaidPro || isUpgrading || !canManageBilling}
                    onClick={() => handlePlanChange("Pro")}
                    className={cn(
                      "w-full text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl cursor-pointer transition-all",
                      isPro
                        ? "bg-slate-100 dark:bg-slate-850 text-slate-400 cursor-not-allowed border border-border"
                        : "btn-primary shadow-lg shadow-primary/15 flex items-center justify-center gap-1.5"
                    )}
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : hasPaidPro ? (
                      "Current Plan"
                    ) : isTrialActive ? (
                      "Upgrade before trial ends"
                    ) : (
                      <>
                        Upgrade to Pro
                        <ArrowUpRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                <ul className="grid grid-cols-1 gap-2.5 pt-4 text-[11px] text-slate-550 dark:text-slate-350">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Per-user pricing — scales with your team size</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Team Space messaging & channels</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Unlimited punch-ins</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Shift roster manager with custom timings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Custom leave categories and rules</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Company holiday calendar by branch</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Policy document hub and handbook uploads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Team analytics, punctuality, and reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Priority billing and support assistance</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-450 dark:text-slate-400">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Advanced exports and audit trail <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-550 px-1 py-0.5 rounded ml-1">Soon</span></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="border-t border-border/40 pt-6">
            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4">
              Compare plans
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-border">
                    <th className="p-3">Feature</th>
                    <th className="p-3 text-center w-24">FREE</th>
                    <th className="p-3 text-center w-24 text-primary">PRO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: "Teammates", free: "Up to 3", pro: "Per user (subscription)" },
                    { name: "Punch-ins per month", free: "50", pro: "Unlimited" },
                    { name: "Team Space", free: false, pro: true },
                    { name: "Attendance punch tracking", free: true, pro: true },
                    { name: "Leave requests & approvals", free: true, pro: true },
                    { name: "Shift roster manager", free: false, pro: true },
                    { name: "Custom leave categories", free: false, pro: true },
                    { name: "Holiday calendar management", free: false, pro: true },
                    { name: "Policy document uploads", free: false, pro: true },
                    { name: "Team analytics & punctuality reports", free: false, pro: true },
                    { name: "Audit trail (Soon)", free: false, pro: "Soon" },
                    { name: "CSV / PDF exports (Soon)", free: false, pro: "Soon" }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                      <td className="p-3 font-semibold text-slate-650 dark:text-slate-350">{row.name}</td>
                      <td className="p-3 text-center">
                        {typeof row.free === "string" ? (
                          <span className="font-bold text-slate-700 dark:text-slate-200">{row.free}</span>
                        ) : row.free ? (
                          <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-slate-350 dark:text-slate-750 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {typeof row.pro === "string" ? (
                          <span className="font-bold text-slate-805 dark:text-white">{row.pro}</span>
                        ) : row.pro ? (
                          <Check className="h-4 w-4 text-primary mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-slate-350 dark:text-slate-750 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer inside Modal */}
          <div className="border-t border-border/40 pt-4 mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-400">
            <span>SSL encrypted · 99.9% uptime SLA · Secured by Razorpay</span>
            {!hasPaidPro && canManageBilling && (
              <button
                type="button"
                onClick={() => handlePlanChange("Pro")}
                disabled={isUpgrading}
                className="btn-primary self-end sm:self-auto text-xs font-black uppercase tracking-wider py-2 px-5 rounded-xl flex items-center gap-1 cursor-pointer"
              >
                {isUpgrading ? "Processing..." : "Upgrade to Pro"}
                {!isUpgrading && <ArrowUpRight className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
