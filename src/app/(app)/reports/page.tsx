"use client";

import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeaveStore } from "@/stores/leave-store";
import {
  TrendingUp,
  Award,
  Users,
  Clock,
  PieChart,
  CalendarDays,
  Target,
  AlertTriangle,
} from "lucide-react";

export default function ReportsPage() {
  const { employees, leaves } = useLeaveStore();

  // Statistics calculation
  const totalApprovedLeaves = leaves
    .filter((l) => l.status === "Approved")
    .reduce((sum, curr) => sum + curr.totalDays, 0);

  const annualLeavesTaken = leaves
    .filter((l) => l.status === "Approved" && l.type === "Annual")
    .reduce((sum, curr) => sum + curr.totalDays, 0);

  const sickLeavesTaken = leaves
    .filter((l) => l.status === "Approved" && l.type === "Sick")
    .reduce((sum, curr) => sum + curr.totalDays, 0);

  const casualLeavesTaken = leaves
    .filter((l) => l.status === "Approved" && l.type === "Casual")
    .reduce((sum, curr) => sum + curr.totalDays, 0);

  const unpaidOrOtherLeaves = leaves
    .filter(
      (l) =>
        l.status === "Approved" &&
        (l.type === "Unpaid" || l.type === "Maternity/Paternity")
    )
    .reduce((sum, curr) => sum + curr.totalDays, 0);

  const totalPossibleBalance = employees.reduce(
    (sum, curr) =>
      sum +
      curr.leaveBalance.Annual +
      curr.leaveBalance.Sick +
      curr.leaveBalance.Casual,
    0
  );

  // Department ratios (hardcoded standard seeds representing standard distributions)
  const departments = [
    { name: "Engineering", attendance: 96, leaves: 5.5, color: "var(--primary)" },
    { name: "Product Design", attendance: 92, leaves: 4.0, color: "oklch(0.58 0.18 230)" },
    { name: "Human Resources", attendance: 100, leaves: 3.0, color: "oklch(0.55 0.24 260)" },
    { name: "Data Analytics", attendance: 88, leaves: 6.5, color: "oklch(0.65 0.24 260)" },
    { name: "QA Testing", attendance: 94, leaves: 2.0, color: "oklch(0.25 0.02 260)" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Organization Analytics"
        title="Reports & Insights"
        description="Track organizational time-off trends, department attendance benchmarks, and resource availability indexes."
      />

      {/* KPI METRIC CARDS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="crm-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Absence Rate Index
            </CardTitle>
            <PieChart className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              2.4%
            </div>
            <p className="mt-1 text-xs text-emerald-500 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>0.6% improvement from last cycle</span>
            </p>
          </CardContent>
        </Card>

        <Card className="crm-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Total Approved Time-off
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {totalApprovedLeaves} days
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Across all logged categories
            </p>
          </CardContent>
        </Card>

        <Card className="crm-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Remaining Pool Balance
            </CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {totalPossibleBalance} days
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Allocated team balance pool
            </p>
          </CardContent>
        </Card>

        <Card className="crm-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Resource Availability
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              97.6%
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Daily capacity threshold index
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* CHART 1: TIME-OFF CATEGORY DISTRIBUTION */}
        <Card className="crm-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Leave Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Annual Holidays</span>
                <span className="font-semibold text-slate-500">{annualLeavesTaken} days</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${
                      totalApprovedLeaves > 0
                        ? (annualLeavesTaken / totalApprovedLeaves) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Sick & Medical Leaves</span>
                <span className="font-semibold text-slate-500">{sickLeavesTaken} days</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-500"
                  style={{
                    width: `${
                      totalApprovedLeaves > 0
                        ? (sickLeavesTaken / totalApprovedLeaves) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Casual / Emergency Leaves</span>
                <span className="font-semibold text-slate-500">{casualLeavesTaken} days</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-500"
                  style={{
                    width: `${
                      totalApprovedLeaves > 0
                        ? (casualLeavesTaken / totalApprovedLeaves) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Unpaid / Maternity / Other</span>
                <span className="font-semibold text-slate-500">{unpaidOrOtherLeaves} days</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-slate-400 transition-all duration-500"
                  style={{
                    width: `${
                      totalApprovedLeaves > 0
                        ? (unpaidOrOtherLeaves / totalApprovedLeaves) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {totalApprovedLeaves === 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-500 dark:bg-slate-900/40">
                <AlertTriangle className="h-4 w-4 shrink-0 text-slate-400" />
                <span>No approved leave allocations recorded yet to distribute.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CHART 2: DEPARTMENT ATTENDANCE RATIOS */}
        <Card className="crm-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Department Attendance Index
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {departments.map((dept) => (
              <div key={dept.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {dept.name}
                  </span>
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    {dept.attendance}% attendance
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${dept.attendance}%`,
                      backgroundColor: dept.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ADDITIONAL SUMMARY LOGS */}
      <Card className="crm-card">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Analytics Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-3 text-xs leading-relaxed">
            <div className="space-y-1.5">
              <span className="block font-bold text-slate-700 dark:text-slate-300">
                ✦ High Availability Cycles
              </span>
              <p className="text-slate-500">
                Resource levels remain exceptionally strong this month. The current cycle shows a 97.6% availability score, well above our 95% baseline trigger threshold.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="block font-bold text-slate-700 dark:text-slate-300">
                ✦ Planned Time-off Trends
              </span>
              <p className="text-slate-500">
                Annual holidays count for the majority of our approved leaves. Spreading leave schedules across Q2/Q3 prevents potential project bottlenecks.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="block font-bold text-slate-700 dark:text-slate-300">
                ✦ Strict Clock In Metrics
              </span>
              <p className="text-slate-500">
                92% of punches are completed before the 10:00 AM grace period. Department managers are encouraged to support flex-time logs where applicable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
