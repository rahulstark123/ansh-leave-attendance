import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  CheckSquare,
  Clock,
  UsersRound,
  BarChart3,
  Settings,
  Inbox,
  User,
  Building,
  CreditCard,
  MessagesSquare,
  FileText,
  Home,
  Megaphone,
  Activity
} from "lucide-react";

export type NavSectionId =
  | "dashboard"
  | "leave"
  | "attendance"
  | "calendar"
  | "team"
  | "reports"
  | "settings"
  | "announcements"
  | "activity"
  | "workspace";

export interface SubNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface MainNavItem {
  id: NavSectionId;
  label: string;
  href: string;
  icon: LucideIcon;
  subNav?: SubNavItem[];
}

export const mainNav: MainNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "leave",
    label: "Leave Manager",
    href: "/leave",
    icon: Calendar,
    subNav: [
      { id: "my-leave", label: "Leave Requests", href: "/leave", icon: User },
      { id: "approvals", label: "Approvals", href: "/leave/approvals", icon: CheckSquare, badge: "1" },
      { id: "holidays", label: "Holidays", href: "/leave/holidays", icon: Calendar },
      { id: "policies", label: "Leave Policies", href: "/leave/policies", icon: FileText },
    ],
  },
  {
    id: "attendance",
    label: "Attendance",
    href: "/attendance",
    icon: Clock,
    subNav: [
      { id: "logs", label: "Attendance Logs", href: "/attendance", icon: Clock },
      { id: "regularization", label: "Regularization", href: "/attendance/regularization", icon: Calendar },
      { id: "wfh", label: "Work From Home", href: "/attendance/wfh", icon: Home },
    ],
  },
  {
    id: "calendar",
    label: "My Calendar",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    id: "team",
    label: "Team Directory",
    href: "/team",
    icon: UsersRound,
  },
  {
    id: "reports",
    label: "Reports & Analytics",
    href: "/reports",
    icon: BarChart3,
  },
  {
    id: "announcements",
    label: "Announcements",
    href: "/announcements",
    icon: Megaphone,
  },
  {
    id: "activity",
    label: "Activity Feed",
    href: "/activity",
    icon: Activity,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings/profile",
    icon: Settings,
    subNav: [
      { id: "profile", label: "Profile Setting", href: "/settings/profile", icon: User },
      { id: "company", label: "Company Setting", href: "/settings/company", icon: Building },
      { id: "leave-settings", label: "Leave Setting", href: "/settings/leave", icon: Calendar },
      { id: "attendance-settings", label: "Attendance Setting", href: "/settings/attendance", icon: Clock },
      { id: "billing", label: "Billing Page", href: "/settings/billing", icon: CreditCard },
    ],
  },
];

export function getSectionFromPath(pathname: string): NavSectionId {
  if (pathname === "/dashboard" || pathname === "/") return "dashboard";
  const segment = pathname.split("/")[1];
  const match = mainNav.find((item) => item.id === segment);
  return match?.id ?? "dashboard";
}


export function getSubNavForSection(sectionId: NavSectionId): SubNavItem[] | undefined {
  return mainNav.find((item) => item.id === sectionId)?.subNav;
}

export function getSectionMeta(sectionId: NavSectionId) {
  return mainNav.find((item) => item.id === sectionId);
}
