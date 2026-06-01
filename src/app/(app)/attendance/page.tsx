"use client";

import { useState } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLeaveStore, type PunchRecord } from "@/stores/leave-store";
import {
  CalendarDays,
  Clock,
  AlertOctagon,
  Award,
  TrendingUp,
  MapPin,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function AttendancePage() {
  const { punchHistory } = useLeaveStore();
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filteredHistory = punchHistory.filter(
    (p) => statusFilter === "All" || p.status === statusFilter
  );

  // Statistics calculations
  const totalDays = punchHistory.length;
  const lateCount = punchHistory.filter((p) => p.status === "Late").length;
  const onTimeCount = punchHistory.filter((p) => p.status === "On-time").length;
  const onTimePercentage = totalDays > 0 ? Math.round((onTimeCount / totalDays) * 100) : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Time & Attendance Tracking"
        title="Attendance Logs"
        description="Review your monthly punch in/out timestamps, check-in statuses, and cumulative working shift hours."
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
            <p className="mt-1.5 text-xs text-slate-400">Punches logged this month</p>
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
              8h 35m
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Productive hours ratio</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER BUTTONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex gap-2.5">
          {["All", "On-time", "Late", "Half-day"].map((filter) => {
            const active = statusFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
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
          <Filter className="h-3.5 w-3.5" />
          <span>Showing {filteredHistory.length} logs</span>
        </div>
      </div>

      {/* ATTENDANCE TABLE CARD */}
      <Card className="crm-card">
        <CardContent className="p-0">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <CalendarDays className="h-10 w-10 text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No attendance punches logged
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Records appear here after you check in and check out.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Work Date</th>
                    <th className="px-6 py-4">Punch In Time</th>
                    <th className="px-6 py-4">Punch Out Time</th>
                    <th className="px-6 py-4 text-center">Shift Duration</th>
                    <th className="px-6 py-4">Status Status</th>
                    <th className="px-6 py-4 text-right">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-sm">
                  {filteredHistory.map((p) => (
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
                        {p.punchIn}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                        {p.punchOut || <span className="text-xs text-primary animate-pulse font-bold">Active...</span>}
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
                        ) : (
                          <Badge variant="destructive">Absent</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-slate-400 font-semibold">
                        {p.status === "Late" ? "Grace time exceeded" : "Routine logged"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
