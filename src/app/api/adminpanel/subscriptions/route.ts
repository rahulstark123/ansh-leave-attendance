import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminpanel/auth";
import { prisma } from "@/lib/db";

function formatAmount(paisa: number, currency: string) {
  const major = paisa / 100;
  if (currency === "USD") return `$${major.toFixed(2)}`;
  return `₹${major.toFixed(2)}`;
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      include: {
        workspace: { select: { id: true, name: true, plan: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = subscriptions.map((s) => ({
      id: s.id,
      workspaceId: s.workspaceId,
      workspaceName: s.workspace.name || `Workspace #${s.workspaceId}`,
      plan: s.plan,
      status: s.status,
      seatsCount: s.seatsCount,
      amount: formatAmount(s.amountPaisa, s.currency),
      amountPaisa: s.amountPaisa,
      currency: s.currency,
      billingCycle: s.billingCycle,
      startsAt: s.startsAt?.toISOString() ?? null,
      expiresAt: s.expiresAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      txnCount: s._count.transactions,
    }));

    const active = subscriptions.filter((s) => s.status === "ACTIVE");
    const pending = subscriptions.filter((s) => s.status === "PENDING");
    const cancelled = subscriptions.filter(
      (s) => s.status === "CANCELLED" || s.status === "EXPIRED"
    );

    const monthlyRecurringPaisa = active.reduce((sum, s) => {
      const monthly =
        s.billingCycle === "yearly" ? Math.round(s.amountPaisa / 12) : s.amountPaisa;
      return sum + monthly;
    }, 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = subscriptions.filter((s) => s.createdAt >= monthStart).length;

    const avgSeats =
      active.length > 0
        ? Math.round(active.reduce((sum, s) => sum + s.seatsCount, 0) / active.length)
        : 0;

    const activeWorkspaces = new Set(active.map((s) => s.workspaceId)).size;

    return NextResponse.json({
      subscriptions: formatted,
      stats: {
        activeCount: active.length,
        totalCount: subscriptions.length,
        pendingCount: pending.length,
        monthlyRecurring: formatAmount(monthlyRecurringPaisa, "INR"),
        newThisMonth,
        cancelledExpired: cancelled.length,
        avgSeats,
        activeWorkspaces,
      },
    });
  } catch (error) {
    console.error("Admin subscriptions GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
