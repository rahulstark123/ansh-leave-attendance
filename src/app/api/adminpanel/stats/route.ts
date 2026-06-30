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

    const [
      openTickets,
      inProgressTickets,
      resolvedTickets,
      totalWorkspaces,
      activeSubscriptions,
      successTransactions,
    ] = await Promise.all([
      prisma.supportTicket.count({ where: { status: "Open" } }),
      prisma.supportTicket.count({ where: { status: "In_Progress" } }),
      prisma.supportTicket.count({ where: { status: "Resolved" } }),
      prisma.workspace.count(),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.transaction.findMany({ where: { status: "SUCCESS" } }),
    ]);

    const totalRevenuePaisa = successTransactions.reduce((sum, t) => sum + t.amountPaisa, 0);

    return NextResponse.json({
      tickets: {
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        total: openTickets + inProgressTickets + resolvedTickets,
      },
      workspaces: totalWorkspaces,
      activeSubscriptions,
      totalRevenue: formatAmount(totalRevenuePaisa, "INR"),
    });
  } catch (error) {
    console.error("Admin stats GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
