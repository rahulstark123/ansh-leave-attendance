"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLeaveStore } from "@/stores/leave-store";
import { Loader2, Clock, ShieldAlert, CheckCircle, Shield, Sparkles } from "lucide-react";

export default function AttendanceSettingPage() {
  const { currentUser, initialize, punchHistory } = useLeaveStore();
  const isAuthorized = currentUser?.role === "HR Manager" || currentUser?.role === "Admin";

  const [shiftStartTime, setShiftStartTime] = useState("09:00 AM");
  const [gracePeriod, setGracePeriod] = useState(15);
  const [workingHours, setWorkingHours] = useState(9);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = sessionStorage.getItem("ansh_auth_token");
        const res = await fetch("/api/settings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.attendanceSettings) {
            setShiftStartTime(data.settings.attendanceSettings.shiftStartTime);
            setGracePeriod(data.settings.attendanceSettings.gracePeriod);
            setWorkingHours(data.settings.attendanceSettings.workingHours);
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!isAuthorized) {
      setErrorMsg("You do not have permission to edit attendance settings.");
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          attendanceSettings: {
            shiftStartTime,
            gracePeriod: Number(gracePeriod),
            workingHours: Number(workingHours),
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save attendance settings");
      }

      await initialize();
      setSuccessMsg("Attendance shift schedules and grace policies updated successfully!");
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while saving attendance settings.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Loading attendance schedule...
          </p>
        </div>
      </div>
    );
  }

  // Calculate shift end time dynamically
  const getShiftEndTime = (start: string, duration: number) => {
    try {
      const [time, modifier] = start.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      const totalHours = hours + duration;
      const endHours = totalHours % 24;
      const displayHours = endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours;
      const displayModifier = endHours >= 12 ? "PM" : "AM";
      const displayMinutes = minutes.toString().padStart(2, "0");

      return `${displayHours.toString().padStart(2, "0")}:${displayMinutes} ${displayModifier}`;
    } catch (e) {
      return "06:00 PM";
    }
  };

  const shiftEndTime = getShiftEndTime(shiftStartTime, workingHours);

  // Compute stats
  const onTimeCount = punchHistory.filter((p) => p.status === "On-time").length;
  const lateCount = punchHistory.filter((p) => p.status === "Late").length;
  const totalPunches = punchHistory.length;
  const onTimeRate = totalPunches > 0 ? Math.round((onTimeCount / totalPunches) * 100) : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Shift Settings"
        title="Attendance Setting"
        description="Configure shift timings, grace periods, and track attendance health analytics."
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left/Middle Column: Shift schedule overview & stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="crm-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Standard Daily Shift
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-800 dark:text-white">
                      {shiftStartTime} - {shiftEndTime}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Standard working duration: {workingHours} hours
                    </p>
                  </div>
                </div>
                <div className="border-t border-border/40 pt-3 flex justify-between text-xs text-slate-500">
                  <span>Grace Period Allowed:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{gracePeriod} minutes</span>
                </div>
              </CardContent>
            </Card>

            <Card className="crm-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Punctuality Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-800 dark:text-white">
                      {onTimeRate}% On-time Rate
                    </h4>
                    <p className="text-xs text-slate-400">
                      Based on your last {totalPunches} punch cycles
                    </p>
                  </div>
                </div>
                <div className="border-t border-border/40 pt-3 flex justify-between text-xs text-slate-500">
                  <span>On-time: {onTimeCount}</span>
                  <span>Late: {lateCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="crm-card">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Punctuality Policy Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500 dark:text-slate-400 space-y-3 leading-relaxed">
              <p>
                1. <strong>Late In Check-in:</strong> If an employee punches in after <strong>{shiftStartTime}</strong> + <strong>{gracePeriod} minutes</strong> (e.g. after {getShiftEndTime(shiftStartTime, gracePeriod / 60)}), the system logs the attendance status as <strong>Late</strong>.
              </p>
              <p>
                2. <strong>Working Hours Requirement:</strong> To complete a full attendance cycle, the duration between punch-in and punch-out must exceed <strong>{workingHours - 1} hours</strong>. Otherwise, it is computed as a <strong>Half-day</strong> check-in.
              </p>
              <p>
                3. <strong>Auto-Check Out:</strong> Active punches that are not closed by 11:59 PM are automatically settled by the system at midnight with a standard 8-hour shift calculation.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Shift Configuration Form */}
        <div className="lg:col-span-1">
          <Card className="crm-card">
            <CardHeader className="flex flex-row items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Shift Timing Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isAuthorized && (
                <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-xs font-bold text-amber-500 mb-6 flex items-start gap-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>Only Administrators and HR Managers can alter company shift times and grace durations.</span>
                </div>
              )}

              {successMsg && (
                <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-xs font-bold text-emerald-400 mb-6 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 text-xs font-bold text-rose-400 mb-6">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                {/* Shift Start Time */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Shift Start Time
                  </label>
                  <select
                    disabled={!isAuthorized}
                    value={shiftStartTime}
                    onChange={(e) => setShiftStartTime(e.target.value)}
                    className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer"
                  >
                    <option value="08:00 AM">08:00 AM</option>
                    <option value="08:30 AM">08:30 AM</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                  </select>
                </div>

                {/* Grace Period */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Grace Period (Minutes)
                  </label>
                  <select
                    disabled={!isAuthorized}
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(Number(e.target.value))}
                    className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer"
                  >
                    <option value="5">5 Minutes</option>
                    <option value="10">10 Minutes</option>
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                  </select>
                </div>

                {/* Shift Duration */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Standard Working Hours
                  </label>
                  <select
                    disabled={!isAuthorized}
                    value={workingHours}
                    onChange={(e) => setWorkingHours(Number(e.target.value))}
                    className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer"
                  >
                    <option value="8">8 Hours</option>
                    <option value="9">9 Hours</option>
                    <option value="10">10 Hours</option>
                  </select>
                </div>

                {isAuthorized && (
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full font-bold text-xs uppercase tracking-wider h-11"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving changes...
                        </>
                      ) : (
                        "Save Timings Settings"
                      )}
                    </Button>
                    <p className="mt-2 text-[9px] text-slate-400 text-center">
                      Saving sets active timings company-wide.
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
