"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLeaveStore } from "@/stores/leave-store";
import {
  CalendarDays,
  Calendar,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";

export default function HolidaysPage() {
  const { currentUser } = useLeaveStore();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const token = sessionStorage.getItem("ansh_auth_token");
        const res = await fetch("/api/settings/holiday", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setHolidays(data.holidays || []);
        }
      } catch (err) {
        console.error("Failed to load holidays:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHolidays();
  }, []);

  const today = new Date().setHours(0, 0, 0, 0);

  const upcomingHolidays = holidays.filter(
    (h) => new Date(h.date).getTime() >= today
  );
  const pastHolidays = holidays.filter(
    (h) => new Date(h.date).getTime() < today
  );

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Loading holiday schedule...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Holiday Calendar"
        title="Official Holidays"
        description="View official company-wide and office location specific holidays for the current cycle."
      />

      {/* BRANCH FOCUS INFO */}
      {currentUser?.branch && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-blue-500/10 bg-blue-500/5 text-xs text-blue-650 dark:text-blue-400 font-semibold max-w-xl">
          <Sparkles className="h-4 w-4 shrink-0 text-blue-500" />
          <span>
            You are assigned to the <strong className="text-blue-700 dark:text-blue-300">"{currentUser.branch}"</strong> branch. Branch-specific holidays for your office are highlighted below.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* UPCOMING HOLIDAYS SECTION */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-500" />
            Upcoming Holidays ({upcomingHolidays.length})
          </h2>

          {upcomingHolidays.length === 0 ? (
            <Card className="crm-card py-12 text-center text-slate-405 text-xs">
              <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              No upcoming company holidays scheduled.
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {upcomingHolidays.map((hol) => {
                const isMyBranch = !hol.branchId || hol.branchId === "All" || hol.branchId === currentUser.branch;
                const hDate = new Date(hol.date);
                const timeDiff = hDate.getTime() - today;
                const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

                return (
                  <Card
                    key={hol.id}
                    className={`crm-card p-5 hover:shadow-md transition-all duration-300 border ${
                      isMyBranch
                        ? "border-border"
                        : "opacity-60 border-dashed border-border/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className={`flex flex-col h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black text-center border ${
                          hol.type === "Gazetted"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                        }`}>
                          <span className="text-[10px] uppercase tracking-wider leading-none">
                            {hDate.toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className="text-base font-black mt-0.5 leading-none">
                            {hDate.getDate()}
                          </span>
                        </div>
                        <div>
                          <span className="block text-sm font-extrabold text-slate-800 dark:text-white">
                            {hol.name}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-1 font-semibold">
                            {hDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric" })}
                          </span>
                        </div>
                      </div>

                      <Badge className="bg-slate-100 hover:bg-slate-100 dark:bg-slate-900 text-[9px] text-slate-500 hover:text-slate-500 font-bold border border-slate-200 dark:border-slate-800 shrink-0">
                        {daysRemaining === 0 ? "Today" : daysRemaining === 1 ? "Tomorrow" : `In ${daysRemaining} days`}
                      </Badge>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-border/40 flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                      {hol.type === "Gazetted" ? (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/10">
                          Gazetted
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/10">
                          Restricted
                        </span>
                      )}

                      {hol.branchId && hol.branchId !== "All" ? (
                        <span className={`px-2 py-0.5 rounded-md border ${
                          isMyBranch
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/10"
                            : "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                        }`}>
                          {hol.branchId} Branch
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">
                          All Branches
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* PAST HOLIDAYS SECTION */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            Passed Holidays ({pastHolidays.length})
          </h2>

          <Card className="crm-card">
            <CardContent className="p-0">
              {pastHolidays.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No passed holidays in current cycle.
                </div>
              ) : (
                <div className="divide-y divide-border/40 px-6 max-h-[500px] overflow-y-auto scrollbar-thin">
                  {pastHolidays.map((hol) => {
                    const isMyBranch = !hol.branchId || hol.branchId === "All" || hol.branchId === currentUser.branch;
                    const hDate = new Date(hol.date);

                    return (
                      <div
                        key={hol.id}
                        className="py-3.5 flex items-center justify-between gap-4 opacity-45"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-center border bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800">
                            <span className="text-[9px] uppercase tracking-wider leading-none">
                              {hDate.toLocaleDateString("en-US", { month: "short" })}
                            </span>
                            <span className="text-sm font-extrabold mt-0.5 leading-none">
                              {hDate.getDate()}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-800 dark:text-white line-through">
                              {hol.name}
                            </span>
                            <span className="block text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                              {hDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric" })}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0 text-[8px] font-black uppercase tracking-wider">
                          <span className="px-1.5 py-0 rounded bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-850 dark:border-slate-700">
                            {hol.type}
                          </span>
                          {hol.branchId && hol.branchId !== "All" ? (
                            <span className="text-slate-400">
                              {hol.branchId} Branch
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              All Branches
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
