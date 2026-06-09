import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { getEmployeeWorkspaceId } from "@/lib/billing/auth";
import {
  ensureWorkspaceBilling,
  getScheduledProSubscription,
} from "@/lib/billing/workspace-billing";
import { formatMajorAmount } from "@/lib/billing/charge-region";
import { resolveWorkspaceAccess } from "@/lib/billing/access";
import { FREE_MAX_PUNCHES_PER_MONTH } from "@/lib/billing/plans";
import { getWorkspacePunchCountThisMonth } from "@/lib/billing/workspace-access";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = getEmployeeWorkspaceId(employee);
    const workspace = await ensureWorkspaceBilling(workspaceId);

    const scheduledSubscription = await getScheduledProSubscription(workspaceId);
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        workspaceId,
        status: "ACTIVE",
        plan: "pro",
      },
      orderBy: { createdAt: "desc" },
    });
    const billingSubscription = activeSubscription ?? scheduledSubscription;

    const transactions = await prisma.transaction.findMany({
      where: { workspaceId, status: "SUCCESS" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const employeeCount = await prisma.employee.count({
      where: { wid: workspaceId },
    });

    const punchesUsedThisMonth = await getWorkspacePunchCountThisMonth(workspaceId);

    const access = resolveWorkspaceAccess({
      plan: workspace.plan,
      planExpiresAt: workspace.planExpiresAt,
      trialEndsAt: workspace.trialEndsAt,
      maxUsers: workspace.maxUsers,
    });

    const billingCycle = billingSubscription?.billingCycle || null;
    const monthlyPrice =
      billingSubscription && billingSubscription.billingCycle === "yearly"
        ? Math.round(billingSubscription.amountPaisa / 12 / (billingSubscription.currency === "INR" ? 100 : 100))
        : billingSubscription
          ? billingSubscription.amountPaisa / 100
          : 0;

    return NextResponse.json({
      workspaceId,
      plan: workspace.plan,
      planName: access.planName,
      maxUsers: access.effectiveMaxUsers,
      planExpiresAt: access.planExpiresAt,
      trialEndsAt: access.trialEndsAt,
      isTrialActive: access.isTrialActive,
      isProActive: access.isProActive,
      hasProAccess: access.hasProAccess,
      trialDaysRemaining: access.trialDaysRemaining,
      hasScheduledPro: Boolean(scheduledSubscription),
      scheduledProStartsAt: scheduledSubscription?.startsAt?.toISOString() ?? null,
      scheduledBillingCycle: scheduledSubscription?.billingCycle ?? null,
      billingCycle,
      price: access.isProActive || scheduledSubscription ? monthlyPrice : 0,
      currency: billingSubscription?.currency || "INR",
      employeeCount,
      punchesUsedThisMonth,
      punchesLimit: access.hasProAccess ? null : FREE_MAX_PUNCHES_PER_MONTH,
      canManageBilling:
        employee.role === "Admin" ||
        employee.role === "HR Manager" ||
        employee.role === "Owner",
      invoices: transactions.map((tx) => ({
        id: tx.razorpayPaymentId || tx.id.slice(0, 12).toUpperCase(),
        date: tx.createdAt.toISOString().slice(0, 10),
        amount: formatMajorAmount(tx.amountPaisa, tx.currency as "INR" | "USD"),
        status: "Paid",
        description: tx.description || "ANSH HR Pro Subscription",
      })),
    });
  } catch (error) {
    console.error("GET /api/billing/status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
