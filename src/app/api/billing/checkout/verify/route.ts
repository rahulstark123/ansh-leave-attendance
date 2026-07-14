import { NextResponse } from "next/server";
import { getBillingAuthorizedEmployee, getEmployeeWorkspaceId } from "@/lib/billing/auth";
import { verifyRazorpaySignature } from "@/lib/billing/razorpay-signature";
import { getRazorpayConfig } from "@/lib/billing/razorpay";
import { computeUpgradeCheckoutMinor } from "@/lib/billing/charge-region";
import {
  activateProSubscription,
  applyAdditionalSeats,
  getCurrentProSubscription,
} from "@/lib/billing/workspace-billing";
import { planDisplayName } from "@/lib/billing/plans";
import { prisma } from "@/lib/db";
import type { BillingCycle } from "@/lib/billing/plans";
import type { ChargeCurrency } from "@/lib/billing/checkout-region";

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
    if (!cfg) {
      return NextResponse.json(
        { error: "Payment gateway is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const orderId = body.razorpay_order_id as string;
    const paymentId = body.razorpay_payment_id as string;
    const signature = body.razorpay_signature as string;
    const workspaceId = (body.workspaceId as number) || getEmployeeWorkspaceId(employee);

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    const valid = verifyRazorpaySignature(
      orderId,
      paymentId,
      signature,
      cfg.keySecret
    );

    if (!valid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { razorpayOrderId: orderId },
      include: { subscription: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (transaction.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Workspace mismatch" }, { status: 403 });
    }

    const subscription = transaction.subscription;
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const activeExisting = await getCurrentProSubscription(workspaceId);
    const desc = (transaction.description || "").toLowerCase();
    const isSeatAdd =
      Boolean(activeExisting) &&
      activeExisting!.id !== subscription.id &&
      (desc.includes("prorated") || desc.includes("added"));

    if (transaction.status === "SUCCESS") {
      const scheduled = subscription.status === "SCHEDULED";
      const seats =
        isSeatAdd && activeExisting
          ? activeExisting.seatsCount
          : subscription.seatsCount;
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        scheduled,
        intent: isSeatAdd ? "add_seats" : scheduled ? "renew" : "upgrade",
        plan: scheduled && !activeExisting ? "free" : "pro",
        planName:
          scheduled && !activeExisting
            ? "ANSH HR Pro Trial"
            : planDisplayName("pro"),
        maxUsers: seats,
        seats,
        proStartsAt: subscription.startsAt?.toISOString() ?? null,
        expiresAt: subscription.expiresAt?.toISOString() ?? null,
      });
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "SUCCESS",
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      },
    });

    // Ensure Saathi code from recharge is on the paid subscription (workspace fallback)
    if (!subscription.saathiCode) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { saathiCode: true },
      });
      const code = workspace?.saathiCode?.trim().toUpperCase() || null;
      if (code) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { saathiCode: code },
        });
        subscription.saathiCode = code;
      }
    }

    if (isSeatAdd && activeExisting && subscription.status === "PENDING") {
      const cycle = activeExisting.billingCycle as BillingCycle;
      const currency = (activeExisting.currency || "INR") as ChargeCurrency;
      const newSeats =
        activeExisting.seatsCount + Math.max(subscription.seatsCount, 1);
      const renewed = computeUpgradeCheckoutMinor({
        currency,
        billingCycle: cycle,
        cfg,
        seats: newSeats,
      });

      const result = await applyAdditionalSeats({
        workspaceId,
        pendingSubscriptionId: subscription.id,
        renewedAmountPaisa: renewed.totalMinor,
      });

      return NextResponse.json({
        success: true,
        intent: "add_seats",
        scheduled: false,
        plan: "pro",
        planName: planDisplayName("pro"),
        maxUsers: result.seats,
        seats: result.seats,
        previousSeats: result.previousSeats,
        additionalSeats: result.additionalSeats,
        expiresAt: result.expiresAt?.toISOString() ?? null,
        billingCycle: cycle,
      });
    }

    const { expiresAt, startsAt, scheduled, seats, reason } =
      await activateProSubscription({
        workspaceId,
        billingCycle: subscription.billingCycle as BillingCycle,
        subscriptionId: subscription.id,
      });

    if (scheduled) {
      return NextResponse.json({
        success: true,
        intent: reason === "renewal" ? "renew" : "upgrade",
        scheduled: true,
        plan: reason === "renewal" ? "pro" : "free",
        planName:
          reason === "renewal"
            ? planDisplayName("pro")
            : "ANSH HR Pro Trial",
        maxUsers: seats,
        seats,
        proStartsAt: startsAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        billingCycle: subscription.billingCycle,
        message:
          reason === "renewal"
            ? "Payment successful. Your new plan will start when the current one expires."
            : "Payment successful. Pro billing starts when your trial ends.",
      });
    }

    return NextResponse.json({
      success: true,
      intent: "upgrade",
      scheduled: false,
      plan: "pro",
      planName: planDisplayName("pro"),
      maxUsers: seats,
      seats,
      proStartsAt: startsAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      billingCycle: subscription.billingCycle,
    });
  } catch (error) {
    console.error("POST /api/billing/checkout/verify error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
