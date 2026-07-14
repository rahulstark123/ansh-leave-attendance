import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { getEmployeeWorkspaceId } from "@/lib/billing/auth";
import {
  ensureWorkspaceBilling,
  getCurrentProSubscription,
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
    const activeSubscription = await getCurrentProSubscription(workspaceId);
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

    const freshWorkspace =
      (await prisma.workspace.findUnique({ where: { id: workspaceId } })) ??
      workspace;

    const access = resolveWorkspaceAccess({
      plan: freshWorkspace.plan,
      planExpiresAt: freshWorkspace.planExpiresAt,
      trialEndsAt: freshWorkspace.trialEndsAt,
      maxUsers: freshWorkspace.maxUsers,
    });

    const billingCycle = billingSubscription?.billingCycle || null;
    const monthlyPrice =
      billingSubscription && billingSubscription.billingCycle === "yearly"
        ? Math.round(billingSubscription.amountPaisa / 12 / 100)
        : billingSubscription
          ? billingSubscription.amountPaisa / 100
          : 0;

    const now = new Date();
    const hasFutureRenewal = Boolean(
      scheduledSubscription?.startsAt && scheduledSubscription.startsAt > now
    );

    return NextResponse.json({
      workspaceId,
      plan: freshWorkspace.plan,
      planName: access.planName,
      maxUsers: access.effectiveMaxUsers,
      seatsCount: billingSubscription?.seatsCount ?? access.effectiveMaxUsers,
      planExpiresAt: access.planExpiresAt,
      trialEndsAt: access.trialEndsAt,
      isTrialActive: access.isTrialActive,
      isProActive: access.isProActive,
      hasProAccess: access.hasProAccess,
      trialDaysRemaining: access.trialDaysRemaining,
      hasScheduledPro: Boolean(scheduledSubscription),
      hasFutureRenewal,
      scheduledProStartsAt: scheduledSubscription?.startsAt?.toISOString() ?? null,
      scheduledBillingCycle: scheduledSubscription?.billingCycle ?? null,
      billingCycle,
      subscriptionStartsAt: billingSubscription?.startsAt?.toISOString() ?? null,
      price: access.isProActive || scheduledSubscription ? monthlyPrice : 0,
      currency: billingSubscription?.currency || "INR",
      employeeCount,
      saathiCode: freshWorkspace.saathiCode ?? null,
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
