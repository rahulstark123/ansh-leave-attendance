import { FREE_MAX_USERS, PRO_MAX_USERS, planDisplayName } from "./plans";

export interface WorkspaceBillingState {
  plan: string;
  planExpiresAt: Date | null;
  trialEndsAt: Date | null;
  maxUsers: number;
}

export interface WorkspaceAccess {
  plan: string;
  planName: string;
  hasProAccess: boolean;
  isTrialActive: boolean;
  isProActive: boolean;
  trialEndsAt: string | null;
  planExpiresAt: string | null;
  effectiveMaxUsers: number;
  trialDaysRemaining: number | null;
}

export function resolveWorkspaceAccess(
  workspace: WorkspaceBillingState,
  now = new Date()
): WorkspaceAccess {
  const trialActive = Boolean(
    workspace.trialEndsAt && workspace.trialEndsAt > now
  );
  const proActive =
    workspace.plan === "pro" &&
    (!workspace.planExpiresAt || workspace.planExpiresAt > now);

  const hasProAccess = trialActive || proActive;

  let trialDaysRemaining: number | null = null;
  if (trialActive && workspace.trialEndsAt) {
    const msLeft = workspace.trialEndsAt.getTime() - now.getTime();
    trialDaysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  }

  return {
    plan: workspace.plan,
    planName: trialActive
      ? "ANSH HR Pro Trial"
      : planDisplayName(workspace.plan),
    hasProAccess,
    isTrialActive: trialActive,
    isProActive: proActive,
    trialEndsAt: workspace.trialEndsAt?.toISOString() ?? null,
    planExpiresAt: workspace.planExpiresAt?.toISOString() ?? null,
    effectiveMaxUsers: hasProAccess ? PRO_MAX_USERS : FREE_MAX_USERS,
    trialDaysRemaining,
  };
}

export function getTrialEndDate(from = new Date()): Date {
  const trialEndsAt = new Date(from);
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);
  return trialEndsAt;
}
