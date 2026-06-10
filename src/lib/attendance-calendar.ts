import type { LeaveRequest, PunchRecord } from "@/stores/leave-store";

export type AttendanceDayKind =
  | "present"
  | "late"
  | "half-day"
  | "wfh"
  | "regularized"
  | "absent"
  | "leave"
  | "pending-leave"
  | "holiday"
  | "weekend";

export interface CompanyHoliday {
  name: string;
  date: string;
  type?: string;
  branchId?: string;
}

export interface AttendanceDayInfo {
  date: string;
  kinds: AttendanceDayKind[];
  primaryKind: AttendanceDayKind;
  holiday?: CompanyHoliday;
  leave?: LeaveRequest;
  punch?: PunchRecord;
}

export const DAY_KIND_META: Record<
  AttendanceDayKind,
  { label: string; color: string; dot: string; bg: string }
> = {
  present: {
    label: "Present",
    color: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10 ring-emerald-500/20",
  },
  late: {
    label: "Late",
    color: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    bg: "bg-amber-500/10 ring-amber-500/20",
  },
  "half-day": {
    label: "Half-day",
    color: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    bg: "bg-blue-500/10 ring-blue-500/20",
  },
  wfh: {
    label: "Work From Home",
    color: "text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-500",
    bg: "bg-indigo-500/10 ring-indigo-500/20",
  },
  regularized: {
    label: "Regularized",
    color: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
    bg: "bg-sky-500/10 ring-sky-500/20",
  },
  absent: {
    label: "Absent",
    color: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
    bg: "bg-red-500/10 ring-red-500/20",
  },
  leave: {
    label: "On Leave",
    color: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
    bg: "bg-violet-500/10 ring-violet-500/20",
  },
  "pending-leave": {
    label: "Leave Pending",
    color: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-400",
    bg: "bg-orange-400/10 ring-orange-400/20",
  },
  holiday: {
    label: "Holiday",
    color: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
    bg: "bg-rose-500/10 ring-rose-500/20",
  },
  weekend: {
    label: "Weekend",
    color: "text-slate-500 dark:text-slate-400",
    dot: "bg-slate-300 dark:bg-slate-600",
    bg: "bg-slate-100/50 ring-slate-200/50 dark:bg-slate-800/30 dark:ring-slate-700/50",
  },
};

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Normalize API/store dates (YYYY-MM-DD, ISO strings, or Date) to YYYY-MM-DD. */
export function normalizeDateKey(value: string | Date): string {
  if (value instanceof Date) {
    return toDateKey(value);
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return toDateKey(parsed);
  }
  return trimmed;
}

export function parseDateKey(dateKey: string | Date): Date {
  if (dateKey instanceof Date) {
    const d = new Date(dateKey);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const normalized = normalizeDateKey(dateKey);
  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const current = parseDateKey(startDateStr);
  const end = parseDateKey(endDateStr);

  while (current <= end) {
    dates.push(toDateKey(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function isWeekend(dateKey: string | Date): boolean {
  const day = parseDateKey(dateKey).getDay();
  return day === 0 || day === 6;
}

function punchToKind(status: PunchRecord["status"]): AttendanceDayKind {
  switch (status) {
    case "On-time":
      return "present";
    case "Late":
      return "late";
    case "Half-day":
      return "half-day";
    case "WFH":
      return "wfh";
    case "Regularized":
      return "regularized";
    case "Absent":
      return "absent";
    default:
      return "absent";
  }
}

function pickPrimaryKind(kinds: AttendanceDayKind[]): AttendanceDayKind {
  const priority: AttendanceDayKind[] = [
    "holiday",
    "leave",
    "absent",
    "late",
    "half-day",
    "wfh",
    "regularized",
    "present",
    "pending-leave",
    "weekend",
  ];
  for (const kind of priority) {
    if (kinds.includes(kind)) return kind;
  }
  return "weekend";
}

function holidayAppliesToUser(holiday: CompanyHoliday, userBranch?: string): boolean {
  if (!holiday.branchId || holiday.branchId === "All") return true;
  if (!userBranch) return true;
  return holiday.branchId.toLowerCase() === userBranch.toLowerCase();
}

export function buildAttendanceCalendarMap(params: {
  punchHistory: PunchRecord[];
  leaves: LeaveRequest[];
  holidays: CompanyHoliday[];
  employeeId: string;
  userBranch?: string;
  joiningDate?: string;
  month: Date;
}): Map<string, AttendanceDayInfo> {
  const { punchHistory, leaves, holidays, employeeId, userBranch, joiningDate, month } = params;
  const map = new Map<string, AttendanceDayInfo>();

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const punchByDate = new Map<string, PunchRecord>();
  for (const punch of punchHistory) {
    const key = normalizeDateKey(punch.date);
    if (!punchByDate.has(key)) {
      punchByDate.set(key, punch);
    }
  }

  const userLeaves = leaves.filter((l) => l.employeeId === employeeId);
  const leaveByDate = new Map<string, LeaveRequest>();
  for (const leave of userLeaves) {
    const start = normalizeDateKey(leave.startDate);
    const end = normalizeDateKey(leave.endDate);
    for (const date of getDatesInRange(start, end)) {
      if (!leaveByDate.has(date)) {
        leaveByDate.set(date, leave);
      }
    }
  }

  const holidayByDate = new Map<string, CompanyHoliday>();
  for (const holiday of holidays) {
    if (holidayAppliesToUser(holiday, userBranch)) {
      const key = normalizeDateKey(holiday.date);
      holidayByDate.set(key, { ...holiday, date: key });
    }
  }

  const joining = joiningDate ? parseDateKey(normalizeDateKey(joiningDate)) : null;
  if (joining) joining.setHours(0, 0, 0, 0);

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d);
    const dateKey = toDateKey(date);
    const kinds: AttendanceDayKind[] = [];

    const holiday = holidayByDate.get(dateKey);
    if (holiday) kinds.push("holiday");

    const leave = leaveByDate.get(dateKey);
    if (leave) {
      kinds.push(leave.status === "Approved" ? "leave" : "pending-leave");
    }

    const punch = punchByDate.get(dateKey);
    if (punch) {
      kinds.push(punchToKind(punch.status));
    } else if (isWeekend(dateKey)) {
      kinds.push("weekend");
    } else {
      const dateObj = parseDateKey(dateKey);
      const isPast = dateObj < today;
      const afterJoining = !joining || dateObj >= joining;
      const isWorkingDay = !holiday;

      if (isPast && afterJoining && isWorkingDay && !leave) {
        kinds.push("absent");
      }
    }

    if (kinds.length === 0 && isWeekend(dateKey)) {
      kinds.push("weekend");
    }

    map.set(dateKey, {
      date: dateKey,
      kinds,
      primaryKind: pickPrimaryKind(kinds.length ? kinds : ["weekend"]),
      holiday,
      leave,
      punch,
    });
  }

  return map;
}

export function getMonthSummary(dayMap: Map<string, AttendanceDayInfo>) {
  let present = 0;
  let absent = 0;
  let leave = 0;
  let holidays = 0;
  let late = 0;

  for (const info of dayMap.values()) {
    if (info.kinds.includes("holiday")) holidays++;
    if (info.kinds.includes("leave")) leave++;
    if (info.kinds.includes("absent")) absent++;
    if (info.kinds.includes("late")) late++;
    if (
      info.kinds.some((k) =>
        ["present", "late", "half-day", "wfh", "regularized"].includes(k)
      )
    ) {
      present++;
    }
  }

  return { present, absent, leave, holidays, late };
}
