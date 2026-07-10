"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLeaveStore, type PunchRecord } from "@/stores/leave-store";
import { sortPunchRecordsRecentFirst } from "@/lib/sort-recent-first";
import { SelfieVerifyDialog } from "@/components/attendance/SelfieVerifyDialog";
import { PunchLocationMapDialog } from "@/components/attendance/PunchLocationMapDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarDays,
  Filter,
  Eye,
  ChevronDown,
  Check,
  Loader2,
  User,
  MapPin,
} from "lucide-react";

export default function AttendancePage() {
  const { punchHistory, currentUser, dashboardEmployees } = useLeaveStore();
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [timeFilter, setTimeFilter] = useState<string>("This Week");
  const [userFilter, setUserFilter] = useState<string>("");
  const [viewedHistory, setViewedHistory] = useState<PunchRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPunchForMap, setSelectedPunchForMap] = useState<PunchRecord | null>(null);
  const [selectedSelfieAudit, setSelectedSelfieAudit] = useState<{
    punch: PunchRecord;
    url: string;
    type: "Check-in" | "Check-out";
  } | null>(null);

  const canFilterUsers =
    currentUser?.role === "Admin" ||
    currentUser?.role === "Owner" ||
    currentUser?.role === "HR Manager" ||
    currentUser?.role === "Manager";

  const selectableUsers = useMemo(() => {
    const list = dashboardEmployees.length
      ? dashboardEmployees
      : currentUser?.id
        ? [currentUser]
        : [];
    return [...list].sort((a, b) => {
      if (a.id === currentUser?.id) return -1;
      if (b.id === currentUser?.id) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [dashboardEmployees, currentUser]);

  // Default to self once currentUser is available
  useEffect(() => {
    if (currentUser?.id && !userFilter) {
      setUserFilter(currentUser.id);
    }
  }, [currentUser?.id, userFilter]);

  const loadPunchHistory = useCallback(async (employeeId: string, isSelf: boolean) => {
    if (!employeeId) return;
    setLoadingLogs(true);

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch(`/api/attendance/punch?employeeId=${encodeURIComponent(employeeId)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        if (!isSelf) setViewedHistory([]);
        return;
      }
      const data = await res.json();
      setViewedHistory(sortPunchRecordsRecentFirst(data.punchHistory || []));
    } catch (err) {
      console.error("Failed to load attendance logs:", err);
      if (!isSelf) setViewedHistory([]);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (!userFilter) return;
    const isSelf = userFilter === currentUser?.id;
    if (isSelf) {
      setViewedHistory(sortPunchRecordsRecentFirst(punchHistory));
    }
    void loadPunchHistory(userFilter, isSelf);
    // Only refetch when the selected user changes (not on every punchHistory update)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFilter, currentUser?.id, loadPunchHistory]);

  // Keep self view in sync when store punchHistory updates (e.g. after punch)
  useEffect(() => {
    if (userFilter && userFilter === currentUser?.id) {
      setViewedHistory(sortPunchRecordsRecentFirst(punchHistory));
    }
  }, [punchHistory, userFilter, currentUser?.id]);

  const selectedUser =
    selectableUsers.find((u) => u.id === userFilter) ||
    (userFilter === currentUser?.id ? currentUser : null);

  const isDateWithinRange = (dateStr: string, range: string) => {
    const recordDate = new Date(dateStr);
    recordDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (range === "Today") {
      return recordDate.getTime() === today.getTime();
    }

    if (range === "This Week") {
      const day = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - day);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return recordDate >= startOfWeek && recordDate <= endOfWeek;
    }

    if (range === "This Month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return recordDate >= startOfMonth && recordDate <= endOfMonth;
    }

    if (range === "Last 3 Months") {
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      threeMonthsAgo.setHours(0, 0, 0, 0);
      return recordDate >= threeMonthsAgo && recordDate <= today;
    }

    return true; // All Time
  };

  const timeFilteredHistory = sortPunchRecordsRecentFirst(
    viewedHistory.filter((p) => isDateWithinRange(p.date, timeFilter))
  );

  const filteredHistory = timeFilteredHistory.filter(
    (p) => statusFilter === "All" || p.status === statusFilter
  );

  // Pagination logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedHistory = filteredHistory.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  // Statistics calculations
  const totalDays = timeFilteredHistory.length;
  const lateCount = timeFilteredHistory.filter((p) => p.status === "Late").length;
  const onTimeCount = timeFilteredHistory.filter(
    (p) => p.status === "On-time" || p.status === "WFH" || p.status === "Regularized"
  ).length;
  const onTimePercentage = totalDays > 0 ? Math.round((onTimeCount / totalDays) * 100) : 0;

  const parseDurationToMinutes = (duration?: string | null) => {
    if (!duration) return 0;
    const match = duration.match(/(\d+)h\s*(\d+)m/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      return hours * 60 + minutes;
    }
    const hoursMatch = duration.match(/(\d+)h/);
    if (hoursMatch) {
      return parseInt(hoursMatch[1], 10) * 60;
    }
    const minsMatch = duration.match(/(\d+)m/);
    if (minsMatch) {
      return parseInt(minsMatch[1], 10);
    }
    return 0;
  };

  const completedShifts = timeFilteredHistory.filter((p) => p.punchOut !== null);
  let averageShiftLengthText = "0h 00m";
  if (completedShifts.length > 0) {
    let totalMinutes = 0;
    completedShifts.forEach((p) => {
      totalMinutes += parseDurationToMinutes(p.duration);
    });
    const avgMinutes = Math.round(totalMinutes / completedShifts.length);
    const avgHours = Math.floor(avgMinutes / 60);
    const remainingMins = avgMinutes % 60;
    averageShiftLengthText = `${avgHours}h ${remainingMins.toString().padStart(2, "0")}m`;
  }

  const viewingSelf = !selectedUser || selectedUser.id === currentUser?.id;
  const userLabel = selectedUser
    ? selectedUser.id === currentUser?.id
      ? `Me (${selectedUser.name})`
      : selectedUser.name
    : "Select user";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Time & Attendance Tracking"
        title="Attendance Logs"
        description={
          viewingSelf
            ? "Review your monthly punch in/out timestamps, check-in statuses, and cumulative working shift hours."
            : `Reviewing attendance logs for ${selectedUser?.name}.`
        }
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            {canFilterUsers && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-10 min-w-[10rem] max-w-[14rem] items-center justify-between gap-2 rounded-xl border border-border bg-card dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer select-none">
                  <span className="flex items-center gap-1.5 truncate">
                    <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{userLabel}</span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="max-h-72 w-56 overflow-y-auto bg-card/95 dark:bg-slate-950/95 shadow-2xl backdrop-blur-md border border-border dark:border-slate-700/80 p-1 space-y-0.5 select-none z-[100] animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  {selectableUsers.map((user) => {
                    const label =
                      user.id === currentUser?.id ? `Me (${user.name})` : user.name;
                    const active = userFilter === user.id;
                    return (
                      <DropdownMenuItem
                        key={user.id}
                        onClick={() => {
                          setUserFilter(user.id);
                          setCurrentPage(1);
                        }}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all cursor-pointer outline-none ${
                          active
                            ? "bg-primary/10 text-primary font-bold"
                            : "text-slate-650 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <span className="truncate">{label}</span>
                        {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-10 w-40 items-center justify-between rounded-xl border border-border bg-card dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer select-none">
                <span>{timeFilter}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-card/95 dark:bg-slate-950/95 shadow-2xl backdrop-blur-md border border-border dark:border-slate-700/80 p-1 space-y-0.5 select-none z-[100] animate-in fade-in slide-in-from-top-1 duration-150">
                {["Today", "This Week", "This Month", "Last 3 Months", "All Time"].map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => {
                      setTimeFilter(option);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all cursor-pointer outline-none ${
                      timeFilter === option
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-slate-650 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <span>{option}</span>
                    {timeFilter === option && <Check className="h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* KPI METRICS OVERVIEW */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="crm-card border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Total Days Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800 dark:text-white">
              {totalDays} shifts
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Punches logged this period</p>
          </CardContent>
        </Card>

        <Card className="crm-card border-l-4 border-l-sky-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              On-time Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800 dark:text-white">
              {onTimePercentage}%
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              {onTimeCount} of {totalDays} shifts on schedule
            </p>
          </CardContent>
        </Card>

        <Card className="crm-card border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Late Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800 dark:text-white">
              {lateCount} times
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Punches past 10:00 AM</p>
          </CardContent>
        </Card>

        <Card className="crm-card border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Average Shift Length
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800 dark:text-white">
              {averageShiftLengthText}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Productive hours ratio</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER BUTTONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex gap-2.5">
          {["All", "On-time", "Late", "Regularized", "Half-day", "WFH"].map((filter) => {
            const active = statusFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => {
                  setStatusFilter(filter);
                  setCurrentPage(1);
                }}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all outline-none cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
          {loadingLogs ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading logs…</span>
            </>
          ) : (
            <>
              <Filter className="h-3.5 w-3.5" />
              <span>Showing {filteredHistory.length} logs</span>
            </>
          )}
        </div>
      </div>

      {/* ATTENDANCE TABLE CARD */}
      <Card className="crm-card">
        <CardContent className="p-0">
          {loadingLogs && viewedHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <Loader2 className="h-8 w-8 text-slate-300 mb-4 animate-spin" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Loading attendance logs…
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <CalendarDays className="h-10 w-10 text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No attendance punches logged
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {viewingSelf
                  ? "Records appear here after you check in."
                  : `No punches found for ${selectedUser?.name} in this period.`}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Work Date</th>
                      <th className="px-6 py-4">Punch In Time</th>
                      <th className="px-6 py-4">Punch Out Time</th>
                      <th className="px-6 py-4 text-center">Shift Duration</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Location</th>
                      <th className="px-6 py-4 text-right">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-sm">
                    {paginatedHistory.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-all"
                      >
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          {new Date(p.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                          <div className="flex items-center gap-2">
                            <span>{p.punchIn}</span>
                            {p.punchInPhoto && (
                              <button
                                onClick={() => setSelectedSelfieAudit({
                                  punch: p,
                                  url: p.punchInPhoto!,
                                  type: "Check-in"
                                })}
                                title="View & Verify Check-in Selfie"
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                          {p.punchOut ? (
                            <div className="flex items-center gap-2">
                              <span>{p.punchOut}</span>
                              {p.punchOutPhoto && (
                                <button
                                  onClick={() => setSelectedSelfieAudit({
                                    punch: p,
                                    url: p.punchOutPhoto!,
                                    type: "Check-out"
                                  })}
                                  title="View & Verify Check-out Selfie"
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-primary animate-pulse font-bold">Active...</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          {p.duration || "—"}
                        </td>
                        <td className="px-6 py-4">
                          {p.status === "On-time" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-0 hover:bg-emerald-500/10">
                              On-time
                            </Badge>
                          ) : p.status === "Late" ? (
                            <Badge className="bg-amber-500/10 text-amber-600 border-0 hover:bg-amber-500/10">
                              Late
                            </Badge>
                          ) : p.status === "Half-day" ? (
                            <Badge className="bg-blue-500/10 text-blue-600 border-0 hover:bg-blue-500/10">
                              Half-day
                            </Badge>
                          ) : p.status === "WFH" ? (
                            <Badge className="bg-indigo-500/10 text-indigo-600 border-0 hover:bg-indigo-500/10">
                              WFH
                            </Badge>
                          ) : p.status === "Regularized" ? (
                            <Badge className="bg-sky-500/10 text-sky-600 border-0 hover:bg-sky-500/10">
                              Regularized
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Absent</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedPunchForMap(p)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                            title="View punch location map"
                          >
                            <MapPin className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-slate-400 font-semibold">
                          {!p.punchOut
                            ? "Shift in progress"
                            : p.status === "Regularized"
                              ? "Manager-approved correction"
                              : p.status === "Late"
                                ? "Grace time exceeded"
                                : "Routine logged"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 px-6 py-4 bg-slate-50/30 dark:bg-slate-900/10">
                  <div className="text-xs text-slate-400 font-semibold">
                    Showing <span className="font-bold text-slate-700 dark:text-slate-300">{((activePage - 1) * itemsPerPage) + 1}</span> to{" "}
                    <span className="font-bold text-slate-700 dark:text-slate-300">{Math.min(activePage * itemsPerPage, filteredHistory.length)}</span> of{" "}
                    <span className="font-bold text-slate-700 dark:text-slate-300">{filteredHistory.length}</span> logs
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={activePage === 1}
                      className="h-8 rounded-lg text-xs font-bold px-3 py-1 cursor-pointer select-none"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={activePage === page ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 rounded-lg text-xs font-bold cursor-pointer select-none p-0 ${
                            activePage === page
                              ? "bg-primary text-primary-foreground border-0 hover:bg-primary/90"
                              : "text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={activePage === totalPages}
                      className="h-8 rounded-lg text-xs font-bold px-3 py-1 cursor-pointer select-none"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <PunchLocationMapDialog
        punch={selectedPunchForMap}
        onClose={() => setSelectedPunchForMap(null)}
      />

      <SelfieVerifyDialog
        isOpen={selectedSelfieAudit !== null}
        onClose={() => setSelectedSelfieAudit(null)}
        selfieUrl={selectedSelfieAudit?.url || null}
        employeeId={selectedUser?.id || currentUser?.id || "unknown"}
        employeeName={selectedUser?.name || currentUser?.name || "Employee"}
        punchTime={selectedSelfieAudit?.type === "Check-in" ? selectedSelfieAudit.punch.punchIn : (selectedSelfieAudit?.punch.punchOut || "")}
        punchDate={selectedSelfieAudit?.punch.date || ""}
        type={selectedSelfieAudit?.type || "Check-in"}
      />
    </div>
  );
}
