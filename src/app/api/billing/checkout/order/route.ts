import { NextResponse } from "next/server";
import { getBillingAuthorizedEmployee, getEmployeeWorkspaceId } from "@/lib/billing/auth";
import { resolveCheckoutFromRequest } from "@/lib/billing/checkout-region";
import { computeUpgradeCheckoutMinor } from "@/lib/billing/charge-region";
import { getRazorpayConfig, getRazorpayInstance } from "@/lib/billing/razorpay";
import { ensureWorkspaceBilling } from "@/lib/billing/workspace-billing";
import { prisma } from "@/lib/db";
import type { BillingCycle } from "@/lib/billing/plans";

export async function POST(req: Request) {
  try {
    const employee = await getBillingAuthorizedEmployee(req);
    if (!employee) {
      return NextResponse.json(
        { error: "Unauthorized or insufficient permissions" },
        { status: 403 }
      );
    }

    const cfg = getRazorpayConfig();
    const rzp = getRazorpayInstance();
    if (!cfg || !rzp) {
      return NextResponse.json(
        { error: "Payment gateway is not configured. Contact support." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const billingCycle = (body.billingCycle || "monthly") as BillingCycle;
    const billingCountry = body.billingCountry as string | undefined;

    if (billingCycle !== "monthly" && billingCycle !== "yearly") {
      return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
    }

    const workspaceId = getEmployeeWorkspaceId(employee);
    const workspace = await ensureWorkspaceBilling(workspaceId);

    if (workspace.plan === "pro" && workspace.planExpiresAt && workspace.planExpiresAt > new Date()) {
      return NextResponse.json(
        { error: "Workspace already has an active Pro plan" },
        { status: 400 }
      );
    }

    const seatsCount = await prisma.employee.count({
      where: { wid: workspaceId },
    });
    const billableSeats = Math.max(seatsCount, 1);

    const { countryCode, currency } = resolveCheckoutFromRequest(req, billingCountry);
    const { amountMinor } = computeUpgradeCheckoutMinor({
      currency,
      billingCycle,
      cfg,
      seats: billableSeats,
    });

    const receipt = `hr_${workspaceId}_${Date.now()}`.slice(0, 40);
    const order = await rzp.orders.create({
      amount: amountMinor,
      currency,
      receipt,
      notes: {
        workspaceId: String(workspaceId),
        billingCycle,
        seats: String(billableSeats),
        countryCode,
        chargeCurrency: currency,
        employeeId: employee.id,
      },
    });

    const subscription = await prisma.subscription.create({
      data: {
        workspaceId,
        employeeId: employee.id,
        status: "PENDING",
        plan: "pro",
        seatsCount: billableSeats,
        billingCycle,
        amountPaisa: amountMinor,
        currency,
        razorpayOrderId: order.id,
      },
    });

    await prisma.transaction.create({
      data: {
        workspaceId,
        subscriptionId: subscription.id,
        status: "CREATED",
        amountPaisa: amountMinor,
        currency,
        razorpayOrderId: order.id,
        description: `ANSH HR Pro — ${billingCycle === "yearly" ? "Yearly" : "Monthly"} (${billableSeats} users)`,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: amountMinor,
      currency,
      keyId: cfg.keyId,
      seats: billableSeats,
    });
  } catch (error) {
    console.error("POST /api/billing/checkout/order error:", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
