import { prisma } from "@/lib/db";
import { FREE_MAX_USERS, PRO_MAX_USERS } from "./plans";
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

  return maybeActivateScheduledPro(workspace);
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

export async function maybeActivateScheduledPro<T extends { id: number }>(workspace: T) {
  const full = await prisma.workspace.findUnique({ where: { id: workspace.id } });
  if (!full) return workspace;

  const now = new Date();
  if (isTrialActive(full.trialEndsAt, now)) {
    return full;
  }

  const scheduled = await getScheduledProSubscription(full.id);
  if (!scheduled || !scheduled.startsAt || !scheduled.expiresAt) {
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
      maxUsers: PRO_MAX_USERS,
      planExpiresAt: scheduled.expiresAt,
    },
  });
}

export async function createWorkspaceWithTrial(name: string) {
  return prisma.workspace.create({
    data: {
      name,
      plan: "free",
      maxUsers: PRO_MAX_USERS,
      trialEndsAt: getTrialEndDate(),
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

  const now = new Date();
  const trialActive = isTrialActive(workspace.trialEndsAt, now);
  const startsAt =
    trialActive && workspace.trialEndsAt ? workspace.trialEndsAt : now;
  const expiresAt = addBillingPeriod(startsAt, params.billingCycle);

  if (trialActive) {
    await prisma.subscription.update({
      where: { id: params.subscriptionId },
      data: {
        status: "SCHEDULED",
        startsAt,
        expiresAt,
      },
    });

    return { startsAt, expiresAt, scheduled: true as const };
  }

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
      maxUsers: PRO_MAX_USERS,
      planExpiresAt: expiresAt,
    },
  });

  return { startsAt, expiresAt, scheduled: false as const };
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
