import { NextResponse } from "next/server";
import { getBillingAuthorizedEmployee, getEmployeeWorkspaceId } from "@/lib/billing/auth";
import { resolveCheckoutFromRequest } from "@/lib/billing/checkout-region";
import { computeUpgradeCheckoutMinor } from "@/lib/billing/charge-region";
import { getRazorpayConfig, getRazorpayInstance } from "@/lib/billing/razorpay";
import {
  ensureWorkspaceBilling,
  getScheduledProSubscription,
} from "@/lib/billing/workspace-billing";
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

    const scheduledPro = await getScheduledProSubscription(workspaceId);
    if (scheduledPro) {
      return NextResponse.json(
        { error: "Pro is already purchased and will start when your trial ends" },
        { status: 400 }
      );
    }

    const seatsCount = await prisma.employee.count({
      where: { wid: workspaceId },
    });
    const minSeats = Math.max(seatsCount, 1);

    const requestedSeats =
      typeof body.seats === "number"
        ? Math.floor(body.seats)
        : typeof body.seats === "string"
          ? Math.floor(Number(body.seats))
          : minSeats;

    if (!Number.isFinite(requestedSeats) || requestedSeats < 1) {
      return NextResponse.json({ error: "Invalid seat count" }, { status: 400 });
    }

    if (requestedSeats < minSeats) {
      return NextResponse.json(
        { error: `Seat count must be at least ${minSeats} for your current team size` },
        { status: 400 }
      );
    }

    const billableSeats = Math.min(requestedSeats, 500);

    const { countryCode, currency } = await resolveCheckoutFromRequest(req, billingCountry);
    const { amountMinor, monthlyEquivalentMajor } = computeUpgradeCheckoutMinor({
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
      countryCode,
      keyId: cfg.keyId,
      seats: billableSeats,
      perUserMonthlyMajor: monthlyEquivalentMajor,
      billingCycle,
    });
  } catch (error) {
    console.error("POST /api/billing/checkout/order error:", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
