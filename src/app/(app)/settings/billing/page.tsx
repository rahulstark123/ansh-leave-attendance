"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLeaveStore } from "@/stores/leave-store";
import { Loader2, CreditCard, ShieldCheck, CheckCircle2, ArrowUpRight, HelpCircle, Receipt } from "lucide-react";

export default function BillingSettingPage() {
  const { currentUser, employees } = useLeaveStore();

  const [planName, setPlanName] = useState("ANSH HR Premium - Startup Edition");
  const [maxUsers, setMaxUsers] = useState(50);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = sessionStorage.getItem("ansh_auth_token");
        const res = await fetch("/api/settings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.billingSettings) {
            setPlanName(data.settings.billingSettings.planName);
            setMaxUsers(data.settings.billingSettings.maxUsers);
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchSettings();
  }, []);

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

  const mockInvoices = [
    { id: "INV-2026-003", date: "2026-06-01", amount: "₹0.00", status: "Paid", description: "ANSH HR Premium Subscription" },
    { id: "INV-2026-002", date: "2026-05-01", amount: "₹0.00", status: "Paid", description: "ANSH HR Premium Subscription" },
    { id: "INV-2026-001", date: "2026-04-01", amount: "₹0.00", status: "Paid", description: "ANSH HR Premium Subscription" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Financial Settings"
        title="Billing Page"
        description="Review your active ANSH HR subscription plan, check seat allocation thresholds, and view payment invoices."
      />

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
              <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Active
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pricing Rate
                  </p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                    ₹0<span className="text-xs font-semibold text-slate-400">/mo</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Billing Cycle
                  </p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1.5">
                    Monthly
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Next Renewal Date
                  </p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1.5">
                    July 01, 2026
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
                  Your plan supports up to {maxUsers} registered employee directory records. Contact support to request additional slots.
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
                    {mockInvoices.map((inv) => (
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
                    ))}
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
              <div className="p-4 rounded-2xl border border-border/40 bg-slate-50/30 dark:bg-slate-900/10 space-y-2 opacity-70">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">Free Trial</span>
                  <span className="font-black text-slate-800 dark:text-white">₹0</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Basic dashboard access, capped at 5 registered employees. No customized shift hours.
                </p>
              </div>

              {/* Startup Edition */}
              <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-2 relative">
                <div className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[8px] font-black text-primary-foreground uppercase tracking-wider">
                  Current
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-800 dark:text-white">Startup Premium</span>
                  <span className="font-black text-slate-900 dark:text-white">₹0</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Full access to custom shifts, grace periods, leave balancings, and up to 50 active employees.
                </p>
              </div>

              {/* Enterprise */}
              <div className="p-4 rounded-2xl border border-border/40 bg-slate-50/30 dark:bg-slate-900/10 space-y-2 opacity-70">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">Enterprise</span>
                  <span className="font-black text-slate-800 dark:text-white">Custom</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Dedicated single-tenant servers, unlimited employee slots, customized SLAs.
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
              <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider h-10 border-border/60 hover:bg-slate-100 dark:hover:bg-slate-800">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
