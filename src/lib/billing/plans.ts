export const FREE_MAX_USERS = 3;
/** Seat ceiling during free Pro trial (before seats are purchased). */
export const TRIAL_MAX_USERS = 100;
/** @deprecated Use purchased seats / workspace.maxUsers. Kept as trial ceiling alias. */
export const PRO_MAX_USERS = TRIAL_MAX_USERS;
export const MAX_BILLABLE_SEATS = 500;
export const FREE_MAX_PUNCHES_PER_MONTH = 50;
/** GST rate applied on INR charges (India). */
export const GST_RATE = 0.18;

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
