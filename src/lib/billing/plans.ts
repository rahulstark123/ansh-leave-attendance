export const FREE_MAX_USERS = 3;
export const PRO_MAX_USERS = 100;
export const FREE_MAX_PUNCHES_PER_MONTH = 50;

export const FREE_PLAN_NAME = "ANSH HR Free Edition";
export const PRO_PLAN_NAME = "ANSH HR Pro Edition";
export const TRIAL_PLAN_NAME = "ANSH HR Pro Trial";

export type BillingCycle = "monthly" | "yearly";

export function isProPlan(plan: string | null | undefined): boolean {
  return plan === "pro";
}

export function planDisplayName(plan: string | null | undefined): string {
  return isProPlan(plan) ? PRO_PLAN_NAME : FREE_PLAN_NAME;
}
