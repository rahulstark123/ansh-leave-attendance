"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeaveStore } from "@/stores/leave-store";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  TrendingUp,
  Award,
  Users,
  Clock,
  PieChart,
  CalendarDays,
  Target,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

export default function ReportsPage() {
  const { currentUser } = useLeaveStore();

  const isAllowed = 
    currentUser?.role === "Admin" ||
    currentUser?.role === "Owner" ||
    currentUser?.role === "HR Manager" ||
    currentUser?.role === "Manager";

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(isAllowed);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAllowed) return;

    const fetchAnalytics = async () => {
      try {
        const token = sessionStorage.getItem("ansh_auth_token");
        const res = await fetch("/api/analytics", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load reports data.");
        }
        const json = await res.json();
        setAnalyticsData(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAllowed]);

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
        <Card className="crm-card max-w-md p-8 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800">
          <div className="h-14 w-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
            Access Denied
          </h2>
          <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-semibold">
            You do not have the required permissions to view organization reports and analytics. This section is restricted to Admins, Owners, Managers, and HR Managers.
          </p>
          <div className="mt-6 w-full">
            <Link href="/dashboard" className="w-full">
              <Button className="btn-primary w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse select-none">
        <div className="space-y-3">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>

        {/* KPI cards skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="crm-card border border-slate-200/50 dark:border-slate-800/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts layout skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="crm-card border border-slate-200/50 dark:border-slate-800/50">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                      <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
        <Card className="crm-card max-w-md p-8 flex flex-col items-center justify-center border border-rose-250 dark:border-rose-900/30 bg-rose-500/5">
          <div className="h-14 w-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-extrabold text-rose-500 uppercase tracking-wider">
            Failed to Load Analytics
          </h2>
          <p className="text-xs text-rose-400 mt-2.5 leading-relaxed font-semibold">
            {error}
          </p>
          <div className="mt-6 w-full">
            <Button
              onClick={() => window.location.reload()}
              className="btn-primary w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-500 hover:bg-rose-600 border-0 text-white cursor-pointer"
            >
              Retry Request
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const {
    absenceRate,
    totalApprovedLeaves,
    leaveDistribution,
    punctualityRate,
    resourceAvailability,
    departments,
  } = analyticsData;



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
              {absenceRate}%
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
              Punctuality Index
            </CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {punctualityRate}%
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Punches logged on-time
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
              {resourceAvailability}%
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
            {(!leaveDistribution || leaveDistribution.length === 0) ? (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-500 dark:bg-slate-900/40">
                <AlertTriangle className="h-4 w-4 shrink-0 text-slate-400" />
                <span>No leave types defined yet.</span>
              </div>
            ) : (
              leaveDistribution.map((item: any) => {
                let progressBg = "bg-primary";
                if (item.color === "sky") progressBg = "bg-sky-500";
                else if (item.color === "purple") progressBg = "bg-purple-500";
                else if (item.color === "pink") progressBg = "bg-pink-500";
                else if (item.color === "indigo") progressBg = "bg-indigo-500";
                else if (item.color === "amber") progressBg = "bg-amber-500";
                else if (item.color === "emerald") progressBg = "bg-emerald-500";
                else if (item.color === "slate") progressBg = "bg-slate-400";
                else if (item.color && (item.color.startsWith("#") || item.color.startsWith("rgb"))) {
                  progressBg = "";
                }

                const percentage =
                  totalApprovedLeaves > 0
                    ? (item.daysTaken / totalApprovedLeaves) * 100
                    : 0;

                return (
                  <div key={item.name} className="space-y-1.5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {item.name}
                      </span>
                      <span className="font-semibold text-slate-500">
                        {item.daysTaken} day{item.daysTaken !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${progressBg} transition-all duration-500`}
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: progressBg === "" ? item.color : undefined,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}

            {totalApprovedLeaves === 0 && leaveDistribution && leaveDistribution.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-500 dark:bg-slate-900/40 mt-4">
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
            {departments.map((dept: any) => (
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
