"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Palmtree,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildAttendanceCalendarMap,
  DAY_KIND_META,
  getMonthSummary,
  parseDateKey,
  toDateKey,
  type AttendanceDayInfo,
  type AttendanceDayKind,
  type CompanyHoliday,
} from "@/lib/attendance-calendar";
import type { LeaveRequest, PunchRecord } from "@/stores/leave-store";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarEmployee {
  id: string;
  name: string;
  branch?: string | null;
  joiningDate?: string | null;
}

interface CalendarApiResponse {
  employee: CalendarEmployee;
  punchHistory: PunchRecord[];
  leaves: LeaveRequest[];
  holidays: CompanyHoliday[];
  month: { year: number; month: number };
}

function getCalendarHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("ansh_auth_token") : null;
  const impersonateId =
    typeof window !== "undefined" ? sessionStorage.getItem("ansh_impersonate_user_id") : null;

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(impersonateId ? { "X-Impersonate-User": impersonateId } : {}),
  };
}

function DayCell({
  date,
  info,
  isCurrentMonth,
  isSelected,
  onSelect,
}: {
  date: Date;
  info?: AttendanceDayInfo;
  isCurrentMonth: boolean;
  isSelected: boolean;
  onSelect: (date: Date) => void;
}) {
  const primaryKind = info?.primaryKind ?? (date.getDay() === 0 || date.getDay() === 6 ? "weekend" : undefined);
  const meta = primaryKind ? DAY_KIND_META[primaryKind] : null;
  const kinds = info?.kinds ?? [];

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      className={cn(
        "group relative flex min-h-[72px] flex-col rounded-2xl border p-2 text-left transition-all",
        isCurrentMonth
          ? "border-border/60 bg-card hover:border-primary/30 hover:shadow-sm"
          : "border-transparent bg-transparent opacity-40",
        isSelected && "border-primary ring-2 ring-primary/20 shadow-md",
        isToday(date) && !isSelected && "border-primary/40 bg-primary/5",
        meta && isCurrentMonth && meta.bg
      )}
    >
      <span
        className={cn(
          "text-xs font-bold",
          isToday(date) ? "text-primary" : "text-slate-600 dark:text-slate-300"
        )}
      >
        {format(date, "d")}
      </span>

      {isCurrentMonth && kinds.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-0.5">
          {kinds.slice(0, 3).map((kind) => (
            <span
              key={kind}
              className={cn("h-1.5 w-1.5 rounded-full", DAY_KIND_META[kind].dot)}
              title={DAY_KIND_META[kind].label}
            />
          ))}
        </div>
      )}

      {isCurrentMonth && info?.holiday && (
        <span className="mt-auto truncate text-[9px] font-semibold text-rose-600 dark:text-rose-400">
          {info.holiday.name}
        </span>
      )}

      {isCurrentMonth && !info?.holiday && primaryKind && primaryKind !== "weekend" && (
        <span className={cn("mt-auto truncate text-[9px] font-semibold", meta?.color)}>
          {DAY_KIND_META[primaryKind].label}
        </span>
      )}
    </button>
  );
}

function DayDetailPanel({ info }: { info: AttendanceDayInfo | null }) {
  if (!info) {
    return (
      <Card className="crm-card h-full">
        <CardContent className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
          <CalendarDays className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">Select a day</p>
          <p className="mt-1 max-w-xs text-xs text-slate-400">
            Tap any date to view your attendance, leave, and holiday details.
          </p>
        </CardContent>
      </Card>
    );
  }

  const dateLabel = format(parseDateKey(info.date), "EEEE, MMMM d, yyyy");

  return (
    <Card className="crm-card h-full">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="text-base">{dateLabel}</CardTitle>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {info.kinds.map((kind) => (
            <Badge
              key={kind}
              variant="outline"
              className={cn("text-[10px] font-bold uppercase tracking-wide", DAY_KIND_META[kind].color)}
            >
              {DAY_KIND_META[kind].label}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {info.holiday && (
          <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Holiday</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {info.holiday.name}
            </p>
            {info.holiday.type && (
              <p className="text-xs text-slate-500">{info.holiday.type} holiday</p>
            )}
          </div>
        )}

        {info.leave && (
          <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 p-3">
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <Palmtree className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Leave</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {info.leave.type} leave
            </p>
            <p className="text-xs text-slate-500">
              {info.leave.startDate} → {info.leave.endDate} · {info.leave.status}
            </p>
            {info.leave.reason && (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{info.leave.reason}</p>
            )}
          </div>
        )}

        {info.punch && (
          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Attendance</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400">Punch In</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{info.punch.punchIn}</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400">Punch Out</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {info.punch.punchOut ?? "Active"}
                </p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400">Duration</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {info.punch.duration ?? "—"}
                </p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400">Status</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{info.punch.status}</p>
              </div>
            </div>
          </div>
        )}

        {!info.holiday && !info.leave && !info.punch && info.kinds.includes("absent") && (
          <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-3 text-sm font-semibold text-red-600 dark:text-red-400">
            No attendance record found for this working day.
          </div>
        )}

        {info.kinds.length === 1 && info.kinds[0] === "weekend" && (
          <p className="text-sm text-slate-500">Weekend — no attendance expected.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function AttendanceCalendarView() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [calendarData, setCalendarData] = useState<CalendarApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = useCallback(async (targetMonth: Date) => {
    setLoading(true);
    setError(null);
    try {
      const year = targetMonth.getFullYear();
      const monthNum = targetMonth.getMonth() + 1;
      const res = await fetch(`/api/calendar?year=${year}&month=${monthNum}`, {
        headers: getCalendarHeaders(),
      });
      if (!res.ok) {
        throw new Error("Failed to load calendar data");
      }
      const data: CalendarApiResponse = await res.json();
      setCalendarData(data);
    } catch (err) {
      console.error("Calendar fetch error:", err);
      setError("Could not load your calendar. Please try again.");
      setCalendarData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar(month);
  }, [month, fetchCalendar]);

  const dayMap = useMemo(() => {
    if (!calendarData) return new Map<string, AttendanceDayInfo>();
    return buildAttendanceCalendarMap({
      punchHistory: calendarData.punchHistory,
      leaves: calendarData.leaves,
      holidays: calendarData.holidays,
      employeeId: calendarData.employee.id,
      userBranch: calendarData.employee.branch ?? undefined,
      joiningDate: calendarData.employee.joiningDate ?? undefined,
      month,
    });
  }, [calendarData, month]);

  const summary = useMemo(() => getMonthSummary(dayMap), [dayMap]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    const gridEnd = new Date(monthEnd);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [month]);

  const selectedInfo = selectedDate
    ? dayMap.get(toDateKey(selectedDate)) ?? null
    : null;

  const goToPrevMonth = () =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goToNextMonth = () =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const goToToday = () => {
    const today = new Date();
    setMonth(startOfMonth(today));
    setSelectedDate(today);
  };

  const legendKinds: AttendanceDayKind[] = [
    "present",
    "late",
    "absent",
    "leave",
    "holiday",
    "wfh",
    "half-day",
    "regularized",
    "pending-leave",
  ];

  if (loading && !calendarData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Loading your calendar...
          </p>
        </div>
      </div>
    );
  }

  if (error && !calendarData) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-sm font-semibold text-red-600">{error}</p>
        <Button variant="outline" onClick={() => fetchCalendar(month)}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {calendarData?.employee?.name && (
        <p className="text-xs font-semibold text-slate-500">
          Showing calendar for <span className="text-slate-800 dark:text-slate-200">{calendarData.employee.name}</span>
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Present", value: summary.present, color: "text-emerald-600" },
          { label: "Absent", value: summary.absent, color: "text-red-600" },
          { label: "On Leave", value: summary.leave, color: "text-violet-600" },
          { label: "Holidays", value: summary.holidays, color: "text-rose-600" },
          { label: "Late", value: summary.late, color: "text-amber-600" },
        ].map((stat) => (
          <Card key={stat.label} className="crm-card">
            <CardContent className="flex items-center justify-between py-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {stat.label}
              </span>
              <span className={cn("text-2xl font-bold", stat.color)}>{stat.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative grid gap-6 xl:grid-cols-[1fr_320px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-[1px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <Card className="crm-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
            <div>
              <CardTitle className="text-lg">{format(month, "MMMM yyyy")}</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Your attendance, leave &amp; holiday overview
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" onClick={goToPrevMonth} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon-sm" onClick={goToNextMonth} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((date) => {
                const dateKey = toDateKey(date);
                return (
                  <DayCell
                    key={dateKey}
                    date={date}
                    info={dayMap.get(dateKey)}
                    isCurrentMonth={isSameMonth(date, month)}
                    isSelected={selectedDate ? toDateKey(selectedDate) === dateKey : false}
                    onSelect={setSelectedDate}
                  />
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-border/50 pt-4">
              {legendKinds.map((kind) => (
                <div key={kind} className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", DAY_KIND_META[kind].dot)} />
                  <span className="text-[10px] font-semibold text-slate-500">
                    {DAY_KIND_META[kind].label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <DayDetailPanel info={selectedInfo} />
      </div>
    </div>
  );
}
