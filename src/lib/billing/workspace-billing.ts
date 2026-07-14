import { prisma } from "@/lib/db";
import { FREE_MAX_USERS, TRIAL_MAX_USERS, type BillingCycle } from "./plans";
import { getTrialEndDate } from "./access";

export async function ensureWorkspaceBilling(workspaceId: number) {
  let workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        id: workspaceId,
        name: `Workspace ${workspaceId}`,
        plan: "free",
        maxUsers: FREE_MAX_USERS,
      },
    });
  }

  workspace = await maybeActivateScheduledPro(workspace);

  // Heal / resolve current paid subscription (may promote SCHEDULED → ACTIVE)
  const current = await getCurrentProSubscription(workspace.id);
  if (
    current &&
    workspace.plan === "pro" &&
    current.seatsCount > 0 &&
    workspace.maxUsers !== current.seatsCount
  ) {
    workspace = await prisma.workspace.update({
      where: { id: workspace.id },
      data: { maxUsers: current.seatsCount },
    });
  }

  // Refresh after possible heal
  return (
    (await prisma.workspace.findUnique({ where: { id: workspace.id } })) ??
    workspace
  );
}

function isTrialActive(trialEndsAt: Date | null, now = new Date()) {
  return Boolean(trialEndsAt && trialEndsAt > now);
}

export async function getScheduledProSubscription(workspaceId: number) {
  return prisma.subscription.findFirst({
    where: {
      workspaceId,
      plan: "pro",
      status: "SCHEDULED",
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Find the subscription that currently represents paid Pro for this workspace.
 * Also heals: workspace.plan=pro but subscription still SCHEDULED / missing dates.
 */
export async function getCurrentProSubscription(workspaceId: number) {
  const now = new Date();

  const active = await prisma.subscription.findFirst({
    where: {
      workspaceId,
      plan: "pro",
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });
  if (active) return active;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) return null;

  const workspaceProLive =
    workspace.plan === "pro" &&
    (!workspace.planExpiresAt || workspace.planExpiresAt > now);

  // SCHEDULED period that has already started
  const dueScheduled = await prisma.subscription.findFirst({
    where: {
      workspaceId,
      plan: "pro",
      status: "SCHEDULED",
      startsAt: { lte: now },
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (dueScheduled) {
    await prisma.subscription.update({
      where: { id: dueScheduled.id },
      data: { status: "ACTIVE" },
    });
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        plan: "pro",
        maxUsers: Math.max(dueScheduled.seatsCount, 1),
        planExpiresAt: dueScheduled.expiresAt,
      },
    });
    return prisma.subscription.findUnique({ where: { id: dueScheduled.id } });
  }

  // Workspace says Pro is live — promote latest SCHEDULED / ACTIVE and backfill dates
  if (workspaceProLive) {
    const candidate = await prisma.subscription.findFirst({
      where: {
        workspaceId,
        plan: "pro",
        status: { in: ["SCHEDULED", "ACTIVE"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (candidate) {
      const expiresAt =
        candidate.expiresAt && candidate.expiresAt > now
          ? candidate.expiresAt
          : workspace.planExpiresAt && workspace.planExpiresAt > now
            ? workspace.planExpiresAt
            : addBillingPeriod(
                now,
                (candidate.billingCycle as BillingCycle) || "monthly"
              );

      let startsAt = candidate.startsAt;
      if (!startsAt || startsAt > expiresAt) {
        startsAt = new Date(expiresAt);
        if (candidate.billingCycle === "yearly") {
          startsAt.setFullYear(startsAt.getFullYear() - 1);
        } else {
          startsAt.setMonth(startsAt.getMonth() - 1);
        }
      }

      return prisma.subscription.update({
        where: { id: candidate.id },
        data: {
          status: "ACTIVE",
          startsAt,
          expiresAt,
        },
      });
    }
  }

  return null;
}

export async function maybeActivateScheduledPro<T extends { id: number }>(
  workspace: T
) {
  const full = await prisma.workspace.findUnique({
    where: { id: workspace.id },
  });
  if (!full) return workspace;

  const now = new Date();

  // Don't activate trial-queued billing while free trial is still running
  if (isTrialActive(full.trialEndsAt, now)) {
    return full;
  }

  const scheduled = await getScheduledProSubscription(full.id);
  if (!scheduled || !scheduled.startsAt || !scheduled.expiresAt) {
    return full;
  }

  // Renewal queued for the future — leave SCHEDULED until startsAt
  if (scheduled.startsAt > now) {
    return full;
  }

  await prisma.subscription.update({
    where: { id: scheduled.id },
    data: { status: "ACTIVE" },
  });

  return prisma.workspace.update({
    where: { id: full.id },
    data: {
      plan: "pro",
      maxUsers: Math.max(scheduled.seatsCount, 1),
      planExpiresAt: scheduled.expiresAt,
    },
  });
}

export async function createWorkspaceWithTrial(
  name: string,
  options?: { saathiCode?: string | null }
) {
  const saathiCode = options?.saathiCode?.trim() || null;
  return prisma.workspace.create({
    data: {
      name,
      plan: "free",
      maxUsers: TRIAL_MAX_USERS,
      trialEndsAt: getTrialEndDate(),
      ...(saathiCode ? { saathiCode } : {}),
    },
  });
}

export function addBillingPeriod(
  from: Date,
  billingCycle: "monthly" | "yearly"
): Date {
  const expires = new Date(from);
  if (billingCycle === "yearly") {
    expires.setFullYear(expires.getFullYear() + 1);
  } else {
    expires.setMonth(expires.getMonth() + 1);
  }
  return expires;
}

export async function activateProSubscription(params: {
  workspaceId: number;
  billingCycle: "monthly" | "yearly";
  subscriptionId: string;
}) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
  });
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: params.subscriptionId },
  });
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const seats = Math.max(subscription.seatsCount, 1);
  const now = new Date();
  const trialActive = isTrialActive(workspace.trialEndsAt, now);

  // Purchase during trial → bill after trial ends
  if (trialActive && workspace.trialEndsAt) {
    const startsAt = workspace.trialEndsAt;
    const expiresAt = addBillingPeriod(startsAt, params.billingCycle);
    await prisma.subscription.update({
      where: { id: params.subscriptionId },
      data: {
        status: "SCHEDULED",
        startsAt,
        expiresAt,
      },
    });
    return {
      startsAt,
      expiresAt,
      scheduled: true as const,
      seats,
      reason: "trial" as const,
    };
  }

  // Already on paid Pro → new purchase starts when current period expires
  const current = await getCurrentProSubscription(params.workspaceId);
  const currentEndsAt =
    current?.expiresAt && current.expiresAt > now
      ? current.expiresAt
      : workspace.plan === "pro" &&
          workspace.planExpiresAt &&
          workspace.planExpiresAt > now
        ? workspace.planExpiresAt
        : null;

  if (currentEndsAt) {
    const startsAt = currentEndsAt;
    const expiresAt = addBillingPeriod(startsAt, params.billingCycle);
    await prisma.subscription.update({
      where: { id: params.subscriptionId },
      data: {
        status: "SCHEDULED",
        startsAt,
        expiresAt,
      },
    });
    return {
      startsAt,
      expiresAt,
      scheduled: true as const,
      seats,
      reason: "renewal" as const,
    };
  }

  // Fresh Pro activation
  const startsAt = now;
  const expiresAt = addBillingPeriod(startsAt, params.billingCycle);

  await prisma.subscription.update({
    where: { id: params.subscriptionId },
    data: {
      status: "ACTIVE",
      startsAt,
      expiresAt,
    },
  });

  await prisma.workspace.update({
    where: { id: params.workspaceId },
    data: {
      plan: "pro",
      maxUsers: seats,
      planExpiresAt: expiresAt,
    },
  });

  return {
    startsAt,
    expiresAt,
    scheduled: false as const,
    seats,
    reason: "activate" as const,
  };
}

/**
 * Merge a paid seat-expansion PENDING subscription into the active Pro plan.
 * PENDING.seatsCount is the number of *additional* seats purchased.
 */
export async function applyAdditionalSeats(params: {
  workspaceId: number;
  pendingSubscriptionId: string;
  renewedAmountPaisa: number;
}) {
  const pending = await prisma.subscription.findUnique({
    where: { id: params.pendingSubscriptionId },
  });
  if (!pending || pending.workspaceId !== params.workspaceId) {
    throw new Error("Seat expansion order not found");
  }

  const additionalSeats = Math.max(pending.seatsCount, 1);
  const active = await getCurrentProSubscription(params.workspaceId);

  if (!active) {
    throw new Error("No active Pro subscription to add seats to");
  }

  const newSeats = active.seatsCount + additionalSeats;

  await prisma.subscription.update({
    where: { id: active.id },
    data: {
      seatsCount: newSeats,
      amountPaisa: params.renewedAmountPaisa,
    },
  });

  await prisma.subscription.update({
    where: { id: pending.id },
    data: { status: "CANCELLED" },
  });

  await prisma.workspace.update({
    where: { id: params.workspaceId },
    data: { maxUsers: newSeats },
  });

  return {
    previousSeats: active.seatsCount,
    additionalSeats,
    seats: newSeats,
    expiresAt: active.expiresAt,
  };
}

export async function downgradeWorkspaceToFree(workspaceId: number) {
  await prisma.subscription.updateMany({
    where: {
      workspaceId,
      status: { in: ["ACTIVE", "SCHEDULED"] },
    },
    data: { status: "CANCELLED" },
  });

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      plan: "free",
      maxUsers: FREE_MAX_USERS,
      planExpiresAt: null,
    },
  });
}
