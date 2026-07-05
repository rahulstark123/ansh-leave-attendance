/** Canonical public site URL — set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
  "https://hr.anshapps.com";

export const SITE_NAME = "ANSH HR";
export const SITE_TAGLINE = "Leave & Attendance Management for MSMEs";
export const SITE_DESCRIPTION =
  "ANSH HR is a modern leave and attendance platform for Indian MSMEs. Face-verified punch-ins, live shift tracking, leave approvals, team directory, and HR analytics — free for up to 3 teammates.";

export const SITE_KEYWORDS = [
  "HR software India",
  "leave management system",
  "attendance tracking software",
  "employee attendance app",
  "face recognition attendance",
  "MSME HR software",
  "leave and attendance management",
  "workforce management India",
  "biometric attendance online",
  "ANSH HR",
  "ANSH Apps",
];

export const COMPANY = {
  name: "ANSH Apps",
  legalName: "ANSH Apps",
  email: "hello@anshapps.com",
  phone: "+919625727372",
  parentSite: "https://anshapps.com",
} as const;

/** Public marketing pages that should be indexed by search engines. */
export const INDEXABLE_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/privacy",
  "/terms",
] as const;

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
