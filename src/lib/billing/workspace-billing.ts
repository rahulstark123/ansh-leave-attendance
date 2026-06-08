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

  return workspace;
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
  const now = new Date();
  const expiresAt = addBillingPeriod(now, params.billingCycle);

  await prisma.subscription.update({
    where: { id: params.subscriptionId },
    data: {
      status: "ACTIVE",
      startsAt: now,
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

  return { startsAt: now, expiresAt };
}

export async function downgradeWorkspaceToFree(workspaceId: number) {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      plan: "free",
      maxUsers: FREE_MAX_USERS,
      planExpiresAt: null,
    },
  });
}
