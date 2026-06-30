"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subscription {
  id: string;
  workspaceId: number;
  workspaceName: string;
  plan: string;
  status: string;
  seatsCount: number;
  amount: string;
  billingCycle: string;
  startsAt: string | null;
  expiresAt: string | null;
  txnCount: number;
}

interface Transaction {
  id: string;
  workspaceId: number;
  workspaceName: string;
  plan: string;
  billingCycle: string;
  status: string;
  amount: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  description: string | null;
  createdAt: string;
}

interface SubStats {
  activeCount: number;
  totalCount: number;
  pendingCount: number;
  monthlyRecurring: string;
  newThisMonth: number;
  cancelledExpired: number;
  avgSeats: number;
  activeWorkspaces: number;
}

interface TxnStats {
  totalCount: number;
  successCount: number;
  failedCount: number;
  totalRevenue: string;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-400",
  PENDING: "bg-amber-500/20 text-amber-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  SCHEDULED: "bg-blue-500/20 text-blue-400",
  SUCCESS: "bg-emerald-500/20 text-emerald-400",
  FAILED: "bg-red-500/20 text-red-400",
  CREATED: "bg-white/10 text-white/50",
};

export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState<"subscriptions" | "transactions">("subscriptions");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subStats, setSubStats] = useState<SubStats | null>(null);
  const [txnStats, setTxnStats] = useState<TxnStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/adminpanel/subscriptions").then((r) => r.json()),
      fetch("/api/adminpanel/transactions").then((r) => r.json()),
    ])
      .then(([subData, txnData]) => {
        setSubscriptions(subData.subscriptions || []);
        setSubStats(subData.stats || null);
        setTransactions(txnData.transactions || []);
        setTxnStats(txnData.stats || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5a3ab6]" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Subscriptions & Transactions</h1>
        <p className="mt-1 text-sm text-white/50">All workspace billing activity</p>
      </div>

      <div className="mb-6 flex gap-2">
        {(["subscriptions", "transactions"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "bg-[#5a3ab6] text-white"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "subscriptions" && subStats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Active Subscriptions",
              value: subStats.activeCount,
              sub: `${subStats.totalCount} total · ${subStats.pendingCount} pending`,
            },
            {
              label: "Monthly Recurring",
              value: subStats.monthlyRecurring,
              sub: "From active plans (monthly equiv.)",
              isText: true,
            },
            {
              label: "New This Month",
              value: subStats.newThisMonth,
              sub: `${subStats.cancelledExpired} cancelled / expired`,
            },
            {
              label: "Avg Seats / Plan",
              value: subStats.avgSeats,
              sub: `${subStats.activeWorkspaces} active workspaces`,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-white/10 bg-[#12151f] p-5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                {card.label}
              </p>
              <p className={`mt-2 font-bold text-white ${card.isText ? "text-2xl" : "text-3xl"}`}>
                {card.value}
              </p>
              <p className="mt-1 text-xs text-white/40">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "transactions" && txnStats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Transactions", value: txnStats.totalCount, sub: `${txnStats.successCount} successful` },
            { label: "Failed", value: txnStats.failedCount, sub: "Unsuccessful payments" },
            { label: "Total Revenue", value: txnStats.totalRevenue, sub: "From successful payments", isText: true },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-white/10 bg-[#12151f] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                {card.label}
              </p>
              <p className={`mt-2 font-bold text-white ${card.isText ? "text-2xl" : "text-3xl"}`}>
                {card.value}
              </p>
              <p className="mt-1 text-xs text-white/40">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#12151f]">
        {tab === "subscriptions" ? (
          subscriptions.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-white/40">
              No subscriptions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    <th className="px-5 py-3">Workspace</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Seats</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Cycle</th>
                    <th className="px-4 py-3">Starts</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3">Txns</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((s) => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-5 py-3.5 font-medium text-white">{s.workspaceName}</td>
                      <td className="px-4 py-3.5 capitalize text-white/70">{s.plan}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            STATUS_STYLE[s.status] || "bg-white/10 text-white/50"
                          )}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-white/60">{s.seatsCount}</td>
                      <td className="px-4 py-3.5 text-white/70">{s.amount}</td>
                      <td className="px-4 py-3.5 capitalize text-white/60">{s.billingCycle}</td>
                      <td className="px-4 py-3.5 text-white/40">{formatDate(s.startsAt)}</td>
                      <td className="px-4 py-3.5 text-white/40">{formatDate(s.expiresAt)}</td>
                      <td className="px-4 py-3.5 text-white/60">{s.txnCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : transactions.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-white/40">
            No transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  <th className="px-5 py-3">Workspace</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Payment ID</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-5 py-3.5 font-medium text-white">{t.workspaceName}</td>
                    <td className="px-4 py-3.5 capitalize text-white/70">{t.plan}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          STATUS_STYLE[t.status] || "bg-white/10 text-white/50"
                        )}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-white/70">{t.amount}</td>
                    <td className="max-w-[140px] truncate px-4 py-3.5 font-mono text-xs text-white/40">
                      {t.razorpayOrderId}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3.5 font-mono text-xs text-white/40">
                      {t.razorpayPaymentId || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-white/40">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
