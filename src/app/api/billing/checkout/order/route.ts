import { NextResponse } from "next/server";
import { getBillingAuthorizedEmployee, getEmployeeWorkspaceId } from "@/lib/billing/auth";
import { resolveCheckoutFromRequest } from "@/lib/billing/checkout-region";
import {
  computeProratedAdditionalSeatsMinor,
  computeUpgradeCheckoutMinor,
} from "@/lib/billing/charge-region";
import { getRazorpayConfig, getRazorpayInstance } from "@/lib/billing/razorpay";
import { resolveWorkspaceAccess } from "@/lib/billing/access";
import {
  ensureWorkspaceBilling,
  getCurrentProSubscription,
  getScheduledProSubscription,
} from "@/lib/billing/workspace-billing";
import { MAX_BILLABLE_SEATS } from "@/lib/billing/plans";
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
    const intent = body.intent === "add_seats" ? "add_seats" : "upgrade";
    const requestedSaathi =
      typeof body.saathiCode === "string" ? body.saathiCode.trim().toUpperCase() : "";

    if (billingCycle !== "monthly" && billingCycle !== "yearly") {
      return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
    }

    const workspaceId = getEmployeeWorkspaceId(employee);
    const workspace = await ensureWorkspaceBilling(workspaceId);

    // Persist Saathi code if workspace doesn't have one yet and user provided it
    if (requestedSaathi && !workspace.saathiCode) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { saathiCode: requestedSaathi },
      });
      workspace.saathiCode = requestedSaathi;
    }

    // Attach to this purchase's subscription row when available at recharge
    const saathiForPurchase =
      requestedSaathi ||
      (typeof workspace.saathiCode === "string" && workspace.saathiCode.trim()
        ? workspace.saathiCode.trim().toUpperCase()
        : null);

    const access = resolveWorkspaceAccess({
      plan: workspace.plan,
      planExpiresAt: workspace.planExpiresAt,
      trialEndsAt: workspace.trialEndsAt,
      maxUsers: workspace.maxUsers,
    });

    const activeSubscription = await getCurrentProSubscription(workspaceId);

    // ─── Add seats to an ongoing paid Pro plan (prorated) ───
    if (intent === "add_seats") {
      if (!activeSubscription) {
        return NextResponse.json(
          {
            error:
              "No active Pro plan to add seats to. Upgrade to Pro first, or wait until your scheduled Pro starts.",
          },
          { status: 400 }
        );
      }

      if (!activeSubscription.startsAt || !activeSubscription.expiresAt) {
        return NextResponse.json(
          { error: "Active subscription is missing billing period dates" },
          { status: 400 }
        );
      }

      if (activeSubscription.expiresAt <= new Date()) {
        return NextResponse.json(
          { error: "Your Pro plan has expired. Please renew before adding seats." },
          { status: 400 }
        );
      }

      const additionalSeats =
        typeof body.additionalSeats === "number"
          ? Math.floor(body.additionalSeats)
          : typeof body.additionalSeats === "string"
            ? Math.floor(Number(body.additionalSeats))
            : typeof body.seats === "number"
              ? Math.floor(body.seats)
              : 0;

      if (!Number.isFinite(additionalSeats) || additionalSeats < 1) {
        return NextResponse.json(
          { error: "Enter how many additional seats you want to add" },
          { status: 400 }
        );
      }

      const currentSeats = Math.max(activeSubscription.seatsCount, workspace.maxUsers, 1);
      const newTotal = currentSeats + additionalSeats;
      if (newTotal > MAX_BILLABLE_SEATS) {
        return NextResponse.json(
          { error: `Seat limit is ${MAX_BILLABLE_SEATS}. You can add up to ${MAX_BILLABLE_SEATS - currentSeats} more.` },
          { status: 400 }
        );
      }

      const cycle = activeSubscription.billingCycle as BillingCycle;
      const { countryCode, currency } = await resolveCheckoutFromRequest(req, billingCountry);

      if (
        activeSubscription.currency &&
        activeSubscription.currency !== currency
      ) {
        // Keep charging in the subscription's original currency for consistency
      }

      const chargeCurrency =
        (activeSubscription.currency as "INR" | "USD") || currency;

      const prorated = computeProratedAdditionalSeatsMinor({
        currency: chargeCurrency,
        billingCycle: cycle,
        cfg,
        additionalSeats,
        periodStartsAt: activeSubscription.startsAt,
        periodExpiresAt: activeSubscription.expiresAt,
      });

      if (prorated.totalMinor < 1) {
        return NextResponse.json(
          { error: "No remaining time in the current billing period to prorate" },
          { status: 400 }
        );
      }

      const receipt = `hr_seats_${workspaceId}_${Date.now()}`.slice(0, 40);
      const order = await rzp.orders.create({
        amount: prorated.totalMinor,
        currency: chargeCurrency,
        receipt,
        notes: {
          workspaceId: String(workspaceId),
          intent: "add_seats",
          billingCycle: cycle,
          additionalSeats: String(additionalSeats),
          currentSeats: String(currentSeats),
          newTotalSeats: String(newTotal),
          employeeId: employee.id,
          gstMinor: String(prorated.gstMinor),
        },
      });

      const expansionSub = await prisma.subscription.create({
        data: {
          workspaceId,
          employeeId: employee.id,
          status: "PENDING",
          plan: "pro",
          seatsCount: additionalSeats,
          billingCycle: cycle,
          amountPaisa: prorated.totalMinor,
          currency: chargeCurrency,
          razorpayOrderId: order.id,
          startsAt: activeSubscription.startsAt,
          expiresAt: activeSubscription.expiresAt,
          ...(saathiForPurchase ? { saathiCode: saathiForPurchase } : {}),
        },
      });

      const gstLabel =
        prorated.gstMinor > 0
          ? ` incl. GST ${formatGstPct(prorated.gstRate)}`
          : "";

      await prisma.transaction.create({
        data: {
          workspaceId,
          subscriptionId: expansionSub.id,
          status: "CREATED",
          amountPaisa: prorated.totalMinor,
          currency: chargeCurrency,
          razorpayOrderId: order.id,
          description: `Added ${additionalSeats} seat${additionalSeats === 1 ? "" : "s"} (prorated for ${prorated.daysRemaining} of ${prorated.periodDays} days)${gstLabel}`,
        },
      });

      return NextResponse.json({
        intent: "add_seats",
        orderId: order.id,
        amount: prorated.totalMinor,
        baseAmount: prorated.amountMinor,
        gstAmount: prorated.gstMinor,
        gstRate: prorated.gstRate,
        currency: chargeCurrency,
        countryCode,
        keyId: cfg.keyId,
        additionalSeats,
        currentSeats,
        newTotalSeats: newTotal,
        daysRemaining: prorated.daysRemaining,
        periodDays: prorated.periodDays,
        billingCycle: cycle,
        prorated: true,
        expiresAt: activeSubscription.expiresAt.toISOString(),
        saathiCode: workspace.saathiCode ?? null,
      });
    }

    // ─── New Pro upgrade OR renew for next billing period ───
    const scheduledPro = await getScheduledProSubscription(workspaceId);
    const now = new Date();
    const hasFutureRenewal =
      Boolean(scheduledPro?.startsAt && scheduledPro.startsAt > now);

    if (hasFutureRenewal) {
      return NextResponse.json(
        {
          error:
            "A Pro plan is already scheduled for your next period. It will start when your current plan expires.",
          scheduledProStartsAt: scheduledPro!.startsAt!.toISOString(),
        },
        { status: 400 }
      );
    }

    // If currently on Pro, this purchase is a renewal — charged now, activates when current expires.
    const isRenewal = Boolean(activeSubscription) || access.isProActive;

    const employeeCount = await prisma.employee.count({
      where: { wid: workspaceId },
    });
    const minSeats = Math.max(
      employeeCount,
      activeSubscription?.seatsCount ?? 0,
      workspace.maxUsers && access.isProActive ? workspace.maxUsers : 0,
      1
    );

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

    const billableSeats = Math.min(requestedSeats, MAX_BILLABLE_SEATS);

    const { countryCode, currency } = await resolveCheckoutFromRequest(req, billingCountry);
    const {
      amountMinor,
      gstMinor,
      totalMinor,
      gstRate,
      monthlyEquivalentMajor,
    } = computeUpgradeCheckoutMinor({
      currency,
      billingCycle,
      cfg,
      seats: billableSeats,
    });

    const receipt = `hr_${workspaceId}_${Date.now()}`.slice(0, 40);
    const order = await rzp.orders.create({
      amount: totalMinor,
      currency,
      receipt,
      notes: {
        workspaceId: String(workspaceId),
        intent: "upgrade",
        billingCycle,
        seats: String(billableSeats),
        countryCode,
        chargeCurrency: currency,
        employeeId: employee.id,
        gstMinor: String(gstMinor),
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
        amountPaisa: totalMinor,
        currency,
        razorpayOrderId: order.id,
        ...(saathiForPurchase ? { saathiCode: saathiForPurchase } : {}),
      },
    });

    const gstLabel = gstMinor > 0 ? ` incl. GST ${formatGstPct(gstRate)}` : "";
    const renewStartsAt =
      isRenewal && activeSubscription?.expiresAt
        ? activeSubscription.expiresAt
        : access.isTrialActive && access.trialEndsAt
          ? new Date(access.trialEndsAt)
          : null;

    await prisma.transaction.create({
      data: {
        workspaceId,
        subscriptionId: subscription.id,
        status: "CREATED",
        amountPaisa: totalMinor,
        currency,
        razorpayOrderId: order.id,
        description: isRenewal
          ? `ANSH HR Pro renewal — ${billingCycle === "yearly" ? "Yearly" : "Monthly"} (${billableSeats} users)${gstLabel}`
          : `ANSH HR Pro — ${billingCycle === "yearly" ? "Yearly" : "Monthly"} (${billableSeats} users)${gstLabel}`,
      },
    });

    return NextResponse.json({
      intent: isRenewal ? "renew" : "upgrade",
      orderId: order.id,
      amount: totalMinor,
      baseAmount: amountMinor,
      gstAmount: gstMinor,
      gstRate,
      currency,
      countryCode,
      keyId: cfg.keyId,
      seats: billableSeats,
      perUserMonthlyMajor: monthlyEquivalentMajor,
      billingCycle,
      willScheduleAfterTrial: access.isTrialActive && !isRenewal,
      willScheduleAfterCurrent: isRenewal,
      proStartsAt: renewStartsAt?.toISOString() ?? null,
      saathiCode: workspace.saathiCode ?? null,
    });
  } catch (error) {
    console.error("POST /api/billing/checkout/order error:", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}

function formatGstPct(rate: number) {
  return `${Math.round(rate * 100)}%`;
}
