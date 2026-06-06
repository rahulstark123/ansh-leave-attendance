"use client";

import { useState } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLeaveStore, type PunchRecord } from "@/stores/leave-store";
import { SelfieVerifyDialog } from "@/components/attendance/SelfieVerifyDialog";
import {
  CalendarDays,
  Clock,
  AlertOctagon,
  Award,
  TrendingUp,
  MapPin,
  ChevronRight,
  Filter,
  Eye,
} from "lucide-react";

export default function AttendancePage() {
  const { punchHistory, currentUser } = useLeaveStore();
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedPunchForMap, setSelectedPunchForMap] = useState<PunchRecord | null>(null);
  const [mapTab, setMapTab] = useState<"punch-in" | "punch-out">("punch-in");
  const [selectedSelfieAudit, setSelectedSelfieAudit] = useState<{
    punch: PunchRecord;
    url: string;
    type: "Check-in" | "Check-out";
  } | null>(null);

  const filteredHistory = punchHistory.filter(
    (p) => statusFilter === "All" || p.status === statusFilter
  );

  // Statistics calculations
  const totalDays = punchHistory.length;
  const lateCount = punchHistory.filter((p) => p.status === "Late").length;
  const onTimeCount = punchHistory.filter((p) => p.status === "On-time" || p.status === "WFH").length;
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
          {["All", "On-time", "Late", "Half-day", "WFH"].map((filter) => {
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
                    <th className="px-6 py-4 text-center">Location</th>
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
                        ) : (
                          <Badge variant="destructive">Absent</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(p.punchInLat != null || p.punchOutLat != null) ? (
                          <button
                            onClick={() => {
                              setSelectedPunchForMap(p);
                              setMapTab(p.punchInLat ? "punch-in" : "punch-out");
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                            title="View punch location map"
                          >
                            <MapPin className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
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

      <Dialog open={selectedPunchForMap !== null} onOpenChange={(open) => !open && setSelectedPunchForMap(null)}>
        <DialogContent className="sm:max-w-[460px] p-6 rounded-3xl border border-border/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <DialogHeader className="pb-4 border-b border-border/40">
            <DialogTitle className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary animate-pulse" />
              <span>Punch Geotag Location Map</span>
            </DialogTitle>
          </DialogHeader>

          {selectedPunchForMap && (
            <div className="space-y-6 pt-4">
              {/* Tab selector for punch in/out location */}
              {selectedPunchForMap.punchInLat && selectedPunchForMap.punchOutLat && (
                <div className="flex border border-border/60 rounded-xl p-1 bg-slate-50 dark:bg-slate-950 text-xs font-bold gap-1">
                  <button
                    onClick={() => setMapTab("punch-in")}
                    className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-colors ${
                      mapTab === "punch-in"
                        ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm border border-border/40"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    }`}
                  >
                    Check-in Location
                  </button>
                  <button
                    onClick={() => setMapTab("punch-out")}
                    className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-colors ${
                      mapTab === "punch-out"
                        ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm border border-border/40"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    }`}
                  >
                    Check-out Location
                  </button>
                </div>
              )}

              {/* Embed map */}
              {((mapTab === "punch-in" && selectedPunchForMap.punchInLat) || (mapTab === "punch-out" && selectedPunchForMap.punchOutLat)) ? (
                <div className="space-y-4">
                  <div className="relative w-full h-[280px] rounded-2xl overflow-hidden border border-border bg-slate-50 dark:bg-slate-950 shadow-inner">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${(mapTab === "punch-in" ? selectedPunchForMap.punchInLng! : selectedPunchForMap.punchOutLng!) - 0.005}%2C${(mapTab === "punch-in" ? selectedPunchForMap.punchInLat! : selectedPunchForMap.punchOutLat!) - 0.005}%2C${(mapTab === "punch-in" ? selectedPunchForMap.punchInLng! : selectedPunchForMap.punchOutLng!) + 0.005}%2C${(mapTab === "punch-in" ? selectedPunchForMap.punchInLat! : selectedPunchForMap.punchOutLat!) + 0.005}&layer=mapnik&marker=${mapTab === "punch-in" ? selectedPunchForMap.punchInLat : selectedPunchForMap.punchOutLat}%2C${mapTab === "punch-in" ? selectedPunchForMap.punchInLng : selectedPunchForMap.punchOutLng}`}
                      className="absolute inset-0"
                    />
                  </div>
                  <div className="flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-border/20 text-xs">
                    <div className="flex justify-between items-center py-0.5 border-b border-border/10">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Event Type</span>
                      <span className="font-bold text-primary capitalize">{mapTab.replace("-", " ")} Location</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-border/10">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Coordinates</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {(mapTab === "punch-in" ? selectedPunchForMap.punchInLat : selectedPunchForMap.punchOutLat)?.toFixed(6)}, {(mapTab === "punch-in" ? selectedPunchForMap.punchInLng : selectedPunchForMap.punchOutLng)?.toFixed(6)}
                      </span>
                    </div>
                    <div className="pt-2.5 flex items-center justify-between gap-4">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${mapTab === "punch-in" ? selectedPunchForMap.punchInLat : selectedPunchForMap.punchOutLat},${mapTab === "punch-in" ? selectedPunchForMap.punchInLng : selectedPunchForMap.punchOutLng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer text-center"
                      >
                        Open in Google Maps
                      </a>
                      <button
                        onClick={() => setSelectedPunchForMap(null)}
                        className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No location logged for this event.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SelfieVerifyDialog
        isOpen={selectedSelfieAudit !== null}
        onClose={() => setSelectedSelfieAudit(null)}
        selfieUrl={selectedSelfieAudit?.url || null}
        employeeId={currentUser?.id || "unknown"}
        employeeName={currentUser?.name || "Employee"}
        punchTime={selectedSelfieAudit?.type === "Check-in" ? selectedSelfieAudit.punch.punchIn : (selectedSelfieAudit?.punch.punchOut || "")}
        punchDate={selectedSelfieAudit?.punch.date || ""}
        type={selectedSelfieAudit?.type || "Check-in"}
      />
    </div>
  );
}
