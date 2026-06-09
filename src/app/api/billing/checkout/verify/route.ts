import { NextResponse } from "next/server";
import { getBillingAuthorizedEmployee, getEmployeeWorkspaceId } from "@/lib/billing/auth";
import { verifyRazorpaySignature } from "@/lib/billing/razorpay-signature";
import { getRazorpayConfig } from "@/lib/billing/razorpay";
import { activateProSubscription } from "@/lib/billing/workspace-billing";
import { planDisplayName, PRO_MAX_USERS } from "@/lib/billing/plans";
import { prisma } from "@/lib/db";

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

    if (transaction.status === "SUCCESS") {
      const existingSub = transaction.subscription;
      const scheduled = existingSub?.status === "SCHEDULED";
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        scheduled,
        plan: scheduled ? "free" : "pro",
        planName: scheduled ? "ANSH HR Pro Trial" : planDisplayName("pro"),
        maxUsers: PRO_MAX_USERS,
        proStartsAt: existingSub?.startsAt?.toISOString() ?? null,
        expiresAt: existingSub?.expiresAt?.toISOString() ?? null,
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

    const subscription = transaction.subscription;
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const { expiresAt, startsAt, scheduled } = await activateProSubscription({
      workspaceId,
      billingCycle: subscription.billingCycle as "monthly" | "yearly",
      subscriptionId: subscription.id,
    });

    if (scheduled) {
      return NextResponse.json({
        success: true,
        scheduled: true,
        plan: "free",
        planName: "ANSH HR Pro Trial",
        maxUsers: PRO_MAX_USERS,
        proStartsAt: startsAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        billingCycle: subscription.billingCycle,
      });
    }

    return NextResponse.json({
      success: true,
      scheduled: false,
      plan: "pro",
      planName: planDisplayName("pro"),
      maxUsers: PRO_MAX_USERS,
      proStartsAt: startsAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      billingCycle: subscription.billingCycle,
    });
  } catch (error) {
    console.error("POST /api/billing/checkout/verify error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
