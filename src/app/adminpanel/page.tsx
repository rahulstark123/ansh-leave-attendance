"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessagesSquare, Building2, CreditCard, IndianRupee } from "lucide-react";

interface DashboardStats {
  tickets: { open: number; inProgress: number; resolved: number; total: number };
  workspaces: number;
  activeSubscriptions: number;
  totalRevenue: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/adminpanel/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
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

  const cards = [
    {
      label: "Open Tickets",
      value: stats?.tickets.open ?? 0,
      sub: `${stats?.tickets.inProgress ?? 0} in progress`,
      icon: MessagesSquare,
      href: "/adminpanel/tickets",
      color: "text-amber-400",
    },
    {
      label: "Total Workspaces",
      value: stats?.workspaces ?? 0,
      sub: "Registered workspaces",
      icon: Building2,
      href: "/adminpanel/subscriptions",
      color: "text-blue-400",
    },
    {
      label: "Active Subscriptions",
      value: stats?.activeSubscriptions ?? 0,
      sub: `${stats?.tickets.resolved ?? 0} tickets resolved`,
      icon: CreditCard,
      href: "/adminpanel/subscriptions",
      color: "text-[#5a3ab6]",
    },
    {
      label: "Total Revenue",
      value: stats?.totalRevenue ?? "₹0.00",
      sub: "From successful payments",
      icon: IndianRupee,
      href: "/adminpanel/subscriptions",
      color: "text-emerald-400",
      isText: true,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/50">Platform overview across all workspaces</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-xl border border-white/10 bg-[#12151f] p-5 transition-colors hover:border-[#5a3ab6]/40"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  {card.label}
                </p>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className={`font-bold text-white ${card.isText ? "text-2xl" : "text-3xl"}`}>
                {card.value}
              </p>
              <p className="mt-1 text-xs text-white/40">{card.sub}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-[#12151f] p-6">
        <h2 className="mb-4 text-sm font-semibold text-white">Ticket Summary</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Open", count: stats?.tickets.open ?? 0, color: "text-amber-400" },
            { label: "In Progress", count: stats?.tickets.inProgress ?? 0, color: "text-blue-400" },
            { label: "Resolved", count: stats?.tickets.resolved ?? 0, color: "text-emerald-400" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-white/5 py-4">
              <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
              <p className="mt-1 text-xs text-white/40">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
