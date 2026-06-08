export const TRIAL_DAYS = 14;

export type PlanFeatureId =
  | "team-space"
  | "shift-roster"
  | "leave-categories"
  | "holidays"
  | "policies"
  | "reports";

export interface PlanFeature {
  id: PlanFeatureId;
  moduleName: string;
  message: string;
  paths: string[];
}

export const PLAN_FEATURES: PlanFeature[] = [
  {
    id: "team-space",
    moduleName: "Team Space",
    message:
      "Team Space messaging and channels are not included in your current plan.",
    paths: ["/workspace"],
  },
  {
    id: "shift-roster",
    moduleName: "Shift Roster Manager",
    message:
      "Custom shift timings, grace periods, and roster rules are not included in your current plan.",
    paths: ["/settings/attendance"],
  },
  {
    id: "leave-categories",
    moduleName: "Custom Leave Categories",
    message:
      "Custom leave types, accrual rules, and policy configuration are not included in your current plan.",
    paths: ["/settings/leave"],
  },
  {
    id: "holidays",
    moduleName: "Holiday Calendar",
    message:
      "Company holiday calendar management by branch is not included in your current plan.",
    paths: ["/leave/holidays"],
  },
  {
    id: "policies",
    moduleName: "Policy Documents",
    message:
      "Policy document uploads and handbook management are not included in your current plan.",
    paths: ["/leave/policies"],
  },
  {
    id: "reports",
    moduleName: "Reports & Analytics",
    message:
      "Team analytics, punctuality insights, and advanced reports are not included in your current plan.",
    paths: ["/reports"],
  },
];

const featureById = Object.fromEntries(
  PLAN_FEATURES.map((f) => [f.id, f])
) as Record<PlanFeatureId, PlanFeature>;

export function getPlanFeature(id: PlanFeatureId): PlanFeature {
  return featureById[id];
}

export function getFeatureForPath(pathname: string): PlanFeature | null {
  for (const feature of PLAN_FEATURES) {
    for (const path of feature.paths) {
      if (pathname === path || pathname.startsWith(`${path}/`)) {
        return feature;
      }
    }
  }
  return null;
}

export function isProFeaturePath(pathname: string): boolean {
  return getFeatureForPath(pathname) !== null;
}
