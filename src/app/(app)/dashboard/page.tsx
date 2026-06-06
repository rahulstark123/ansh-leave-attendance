"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLeaveStore } from "@/stores/leave-store";
import { FaceScanDialog } from "@/components/attendance/FaceScanDialog";
import { loadFaceApiModels } from "@/lib/face-api-helper";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Clock,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  FileText,
  UserCheck,
  TrendingUp,
  MapPin,
  Coffee,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const {
    currentUser,
    leaves,
    punchHistory,
    currentPunchIn,
    punchIn,
    punchOut,
    employees,
    faceEnrolled,
  } = useLeaveStore();

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [tickingTimer, setTickingTimer] = useState<string>("00:00:00");
  const [isFaceScanOpen, setIsFaceScanOpen] = useState(false);
  const [isFaceRequiredAlertOpen, setIsFaceRequiredAlertOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"punch-in" | "punch-out" | null>(null);

  const handlePunchClick = (action: "punch-in" | "punch-out") => {
    if (faceEnrolled) {
      setPendingAction(action);
      setIsFaceScanOpen(true);
    } else {
      setIsFaceRequiredAlertOpen(true);
    }
  };

  // Preload face recognition models 2 seconds after dashboard mounts to prevent main thread interference during initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      loadFaceApiModels().catch((err) => {
        console.warn("Failed to preload face-api models:", err);
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Keep clock updated
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update ticking punch timer
  useEffect(() => {
    if (!currentPunchIn) {
      setTickingTimer("00:00:00");
      return;
    }

    const updateTimer = () => {
      const start = new Date(currentPunchIn).getTime();
      const now = new Date().getTime();
      const diff = now - start;

      if (diff < 0) return;

      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const fHrs = hrs.toString().padStart(2, "0");
      const fMins = mins.toString().padStart(2, "0");
      const fSecs = secs.toString().padStart(2, "0");

      setTickingTimer(`${fHrs}:${fMins}:${fSecs}`);
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [currentPunchIn]);

  // Derived statistics
  const pendingLeavesCount = leaves.filter((r) => r.status === "Pending").length;
  const onLeaveCount = employees.filter((e) => e.status === "On Leave").length;
  const activeEmployeesCount = employees.filter((e) => e.status === "Active").length;
  const attendanceRate = Math.round(
    ((activeEmployeesCount + employees.filter((e) => e.status === "Half-day").length) /
      employees.length) *
      100
  );

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "--:--:--";

  const formattedDate = currentTime
    ? currentTime.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Loading...";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Workspace Overview"
        title={`Welcome back, ${currentUser.name}`}
        description={`Here's what is happening at Ansh today. You're logged in as ${currentUser.role}.`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* PUNCH CARD */}
        <Card className="crm-card relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Attendance Punch Clock
              </CardTitle>
            </div>
            {currentPunchIn ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-0 hover:bg-emerald-500/10">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Punched In
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-0">
                Punched Out
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="block text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                  {formattedTime}
                </span>
                <span className="block text-xs font-semibold text-slate-400">
                  {formattedDate}
                </span>
              </div>

              {currentPunchIn && (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-4 min-w-[140px] border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Shift Duration
                  </span>
                  <span className="font-mono text-xl font-bold text-primary mt-1">
                    {tickingTimer}
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                {!currentPunchIn ? (
                  <Button
                    onClick={() => handlePunchClick("punch-in")}
                    className="btn-primary min-w-[140px] font-bold text-sm"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Punch In
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePunchClick("punch-out")}
                    variant="destructive"
                    className="min-w-[140px] font-bold text-sm h-11 rounded-xl shadow-lg shadow-destructive/25 hover:shadow-destructive/40 transition-all border-0"
                  >
                    <Coffee className="mr-2 h-4 w-4" />
                    Punch Out
                  </Button>
                )}
              </div>
            </div>

            {punchHistory.length > 0 && (
              <div className="mt-6 border-t border-border/40 pt-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Last check-in today:</span>
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    {punchHistory[0].date === new Date().toISOString().split("T")[0]
                      ? `${punchHistory[0].punchIn} (Duration: ${punchHistory[0].duration || "Active"})`
                      : "No check-ins today yet"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WORK PROFILE CARD */}
        <Card className="crm-card">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Personal Leaves Remaining
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-emerald-50/50 p-3 dark:bg-emerald-950/20 border border-emerald-500/10">
                <span className="block text-2xl font-extrabold text-primary">
                  {currentUser.leaveBalance.Annual}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Annual
                </span>
              </div>
              <div className="rounded-xl bg-sky-50/50 p-3 dark:bg-sky-950/20 border border-sky-500/10">
                <span className="block text-2xl font-extrabold text-sky-600 dark:text-sky-400">
                  {currentUser.leaveBalance.Sick}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Sick
                </span>
              </div>
              <div className="rounded-xl bg-purple-50/50 p-3 dark:bg-purple-950/20 border border-purple-500/10">
                <span className="block text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                  {currentUser.leaveBalance.Casual}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Casual
                </span>
              </div>
            </div>

            <div className="mt-5">
              <Link href="/leave" className="w-full">
                <Button className="w-full h-10 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all">
                  Request New Leave
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DYNAMIC KPI STATS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="crm-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Today's Attendance Rate
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {attendanceRate}%
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
              <TrendingUp className="h-3 w-3" />
              <span>
                {activeEmployeesCount} active of {employees.length} team members
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="crm-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Pending Leave Requests
            </CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {pendingLeavesCount}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span>Requires attention in approvals</span>
            </div>
          </CardContent>
        </Card>

        <Card className="crm-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Employees On Leave
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {onLeaveCount}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span>Out of office today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="crm-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Total Work Hours Logged
            </CardTitle>
            <MapPin className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {punchHistory.length * 8}h
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span>Cumulative for current cycle</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLES: RECENT REQUESTS & EMPLOYEES ON LEAVE */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* RECENT LEAVE REQUESTS */}
        <Card className="crm-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Recent Leave Requests
              </CardTitle>
              <Link href="/leave" className="text-xs font-bold text-primary hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 px-0">
            <div className="divide-y divide-border/40 px-6">
              {leaves.slice(0, 4).map((req) => (
                <div key={req.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {req.avatarInitials}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-slate-800 dark:text-white">
                        {req.employeeName}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-medium">
                        {req.type} · {req.totalDays} {req.totalDays === 1 ? "day" : "days"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {req.status === "Approved" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-0 hover:bg-emerald-500/10">
                        Approved
                      </Badge>
                    ) : req.status === "Rejected" ? (
                      <Badge className="bg-rose-500/10 text-rose-600 border-0 hover:bg-rose-500/10">
                        Rejected
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-600 border-0 hover:bg-amber-500/10">
                        Pending
                      </Badge>
                    )}
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(req.appliedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* TEAM ON LEAVE & HALF-DAYS */}
        <Card className="crm-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Team Directory Status
              </CardTitle>
              <Link href="/team" className="text-xs font-bold text-primary hover:underline">
                View directory
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 px-0">
            <div className="divide-y divide-border/40 px-6">
              {employees.slice(0, 4).map((emp) => (
                <div key={emp.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {emp.avatarInitials}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-slate-800 dark:text-white">
                        {emp.name}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-medium">
                        {emp.role} · {emp.department}
                      </span>
                    </div>
                  </div>
                  <div>
                    {emp.status === "Active" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-0 hover:bg-emerald-500/10">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : emp.status === "On Leave" ? (
                      <Badge className="bg-blue-500/10 text-blue-600 border-0 hover:bg-blue-500/10">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        On Leave
                      </Badge>
                    ) : emp.status === "Half-day" ? (
                      <Badge className="bg-amber-500/10 text-amber-600 border-0 hover:bg-amber-500/10">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Half-day
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Off</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <FaceScanDialog
        isOpen={isFaceScanOpen}
        onClose={() => {
          setIsFaceScanOpen(false);
          setPendingAction(null);
        }}
        actionName={pendingAction || "punch-in"}
        onSuccess={async () => {
          if (pendingAction === "punch-in") {
            await punchIn();
          } else if (pendingAction === "punch-out") {
            await punchOut();
          }
        }}
      />

      <Dialog open={isFaceRequiredAlertOpen} onOpenChange={setIsFaceRequiredAlertOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 rounded-3xl border border-border/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl select-none animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span>Face Scan Required</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4 text-center">
            <div className="flex justify-center py-2">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-sm animate-pulse">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-extrabold text-slate-850 dark:text-white">Biometric Setup Required</h4>
              <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed font-semibold">
                You must upload your face images (Front, Left, and Right profiles) to register your biometric signature before you can record your attendance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsFaceRequiredAlertOpen(false)}
              className="rounded-xl font-bold text-xs uppercase tracking-wider h-11 w-full border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Link href="/settings/profile" className="w-full block">
              <Button
                className="btn-primary rounded-xl font-bold text-xs uppercase tracking-wider h-11 border-0 w-full flex items-center justify-center"
              >
                Go to Face Setup
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
