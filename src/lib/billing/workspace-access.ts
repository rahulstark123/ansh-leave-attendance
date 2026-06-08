import { prisma } from "@/lib/db";
import { ensureWorkspaceBilling } from "./workspace-billing";
import { resolveWorkspaceAccess } from "./access";
import { FREE_MAX_PUNCHES_PER_MONTH } from "./plans";

export async function getWorkspaceAccess(workspaceId: number) {
  const workspace = await ensureWorkspaceBilling(workspaceId);
  return resolveWorkspaceAccess({
    plan: workspace.plan,
    planExpiresAt: workspace.planExpiresAt,
    trialEndsAt: workspace.trialEndsAt,
    maxUsers: workspace.maxUsers,
  });
}

export async function getWorkspacePunchCountThisMonth(workspaceId: number): Promise<number> {
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return prisma.punchRecord.count({
    where: {
      wid: workspaceId,
      date: { startsWith: monthPrefix },
    },
  });
}

export async function canWorkspacePunchIn(workspaceId: number): Promise<{
  allowed: boolean;
  used: number;
  limit: number | null;
  reason?: string;
}> {
  const access = await getWorkspaceAccess(workspaceId);

  if (access.hasProAccess) {
    return { allowed: true, used: 0, limit: null };
  }

  const used = await getWorkspacePunchCountThisMonth(workspaceId);
  const limit = FREE_MAX_PUNCHES_PER_MONTH;

  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      reason: `Free plan allows ${limit} punch-ins per month. Upgrade to Pro for unlimited attendance.`,
    };
  }

  return { allowed: true, used, limit };
}
