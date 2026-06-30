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

    const transactions = await prisma.transaction.findMany({
      include: {
        workspace: { select: { id: true, name: true } },
        subscription: { select: { plan: true, billingCycle: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = transactions.map((t) => ({
      id: t.id,
      workspaceId: t.workspaceId,
      workspaceName: t.workspace.name || `Workspace #${t.workspaceId}`,
      subscriptionId: t.subscriptionId,
      plan: t.subscription?.plan ?? "—",
      billingCycle: t.subscription?.billingCycle ?? "—",
      status: t.status,
      amount: formatAmount(t.amountPaisa, t.currency),
      amountPaisa: t.amountPaisa,
      currency: t.currency,
      razorpayOrderId: t.razorpayOrderId,
      razorpayPaymentId: t.razorpayPaymentId,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    }));

    const success = transactions.filter((t) => t.status === "SUCCESS");
    const failed = transactions.filter((t) => t.status === "FAILED");
    const totalRevenuePaisa = success.reduce((sum, t) => sum + t.amountPaisa, 0);

    return NextResponse.json({
      transactions: formatted,
      stats: {
        totalCount: transactions.length,
        successCount: success.length,
        failedCount: failed.length,
        totalRevenue: formatAmount(totalRevenuePaisa, "INR"),
      },
    });
  } catch (error) {
    console.error("Admin transactions GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
