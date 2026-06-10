import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Clock,
  UsersRound,
  BarChart3,
  Settings,
  User,
  type LucideIcon
} from "lucide-react";
import { useLeaveStore } from "@/stores/leave-store";

export interface GlobalSearchItem {
  id: string;
  group: "navigation" | "employees" | "leaves";
  label: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: LucideIcon;
}

export function buildGlobalSearchIndex(): GlobalSearchItem[] {
  const items: GlobalSearchItem[] = [
    {
      id: "nav-dash",
      group: "navigation",
      label: "Navigation",
      title: "Dashboard",
      subtitle: "Overview statistics and punch card",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      id: "nav-leave",
      group: "navigation",
      label: "Navigation",
      title: "My Leaves",
      subtitle: "Personal leave logs and request form",
      href: "/leave",
      icon: User,
    },
    {
      id: "nav-appr",
      group: "navigation",
      label: "Navigation",
      title: "Manager Approvals",
      subtitle: "Review pending employee leave requests",
      href: "/leave/approvals",
      icon: CheckSquare,
    },
    {
      id: "nav-attend",
      group: "navigation",
      label: "Navigation",
      title: "Attendance History",
      subtitle: "Clock logs and worked hours tracker",
      href: "/attendance",
      icon: Clock,
    },
    {
      id: "nav-attend-cal",
      group: "navigation",
      label: "Navigation",
      title: "My Calendar",
      subtitle: "Your monthly attendance, leave and holidays",
      href: "/calendar",
      icon: Calendar,
    },
    {
      id: "nav-team",
      group: "navigation",
      label: "Navigation",
      title: "Team Directory",
      subtitle: "Employee status map",
      href: "/team",
      icon: UsersRound,
    },
    {
      id: "nav-rep",
      group: "navigation",
      label: "Navigation",
      title: "Reports & Analytics",
      subtitle: "Leave analytics charts",
      href: "/reports",
      icon: BarChart3,
    },
    {
      id: "nav-set",
      group: "navigation",
      label: "Navigation",
      title: "Settings",
      subtitle: "Appearance and personalization panel",
      href: "/settings",
      icon: Settings,
    },
  ];

  // Try to load state for dynamic indexing
  try {
    const db = useLeaveStore.getState();
    db.employees.forEach(emp => {
      items.push({
        id: `emp-${emp.id}`,
        group: "employees",
        label: "Team Members",
        title: emp.name,
        subtitle: `${emp.department} · ${emp.role} (${emp.status})`,
        href: `/team?search=${encodeURIComponent(emp.name)}`,
        icon: UsersRound,
      });
    });

    db.leaves.forEach(req => {
      items.push({
        id: `req-${req.id}`,
        group: "leaves",
        label: "Leave Requests",
        title: `${req.employeeName} - ${req.type} Leave`,
        subtitle: `${req.startDate} to ${req.endDate} (${req.status})`,
        href: req.status === "Pending" ? "/leave/approvals" : "/leave",
        icon: Calendar,
      });
    });
  } catch (e) {
    // SSR safe
  }

  return items;
}

export function filterSearchItems(items: GlobalSearchItem[], query: string): GlobalSearchItem[] {
  if (!query) return items.slice(0, 7); // Default to nav items
  const q = query.toLowerCase();
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.label.toLowerCase().includes(q)
  );
}

export interface GroupedResults {
  group: "navigation" | "employees" | "leaves";
  label: string;
  items: GlobalSearchItem[];
}

export function groupSearchResults(items: GlobalSearchItem[]): GroupedResults[] {
  const groups: Record<string, { label: string; items: GlobalSearchItem[] }> = {
    navigation: { label: "Pages", items: [] },
    employees: { label: "Employees", items: [] },
    leaves: { label: "Leave Logs", items: [] },
  };

  items.forEach((item) => {
    if (groups[item.group]) {
      groups[item.group].items.push(item);
    }
  });

  return Object.keys(groups)
    .map((k) => ({
      group: k as any,
      label: groups[k].label,
      items: groups[k].items,
    }))
    .filter((g) => g.items.length > 0);
}
