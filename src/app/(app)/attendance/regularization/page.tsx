"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLeaveStore } from "@/stores/leave-store";
import { sortByAppliedAtRecentFirst } from "@/lib/sort-recent-first";
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RegularizationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  avatarInitials: string;
  employeeBranch: string;
  date: string;
  requestedIn: string;
  requestedOut: string;
  reason: string;
  status: string; // "Pending" | "Approved" | "Rejected"
  appliedAt: string;
}

export default function RegularizationPage() {
  const { currentUser, initialize } = useLeaveStore();
  const isAuthorized =
    currentUser?.role === "HR Manager" ||
    currentUser?.role === "Admin" ||
    currentUser?.role === "Owner" ||
    currentUser?.role === "Manager";

  const [activeTab, setActiveTab] = useState<"my" | "team">("my");
  const [requests, setRequests] = useState<RegularizationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [reqDate, setReqDate] = useState("");
  const [reqInTime, setReqInTime] = useState("09:00");
  const [reqOutTime, setReqOutTime] = useState("18:00");
  const [reqReason, setReqReason] = useState("");
  const [shiftHint, setShiftHint] = useState("");

  const loadDefaultShiftTimes = async () => {
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const headers = { Authorization: `Bearer ${token}` };
      const [settingsRes, shiftRes, meRes] = await Promise.all([
        fetch("/api/settings", { headers }),
        fetch("/api/settings/shift", { headers }),
        fetch("/api/auth/me", { headers }),
      ]);

      let punchIn = "09:00 AM";
      let punchOut = "06:00 PM";
      let hint = "Using default attendance shift timings.";

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        const att = data.settings?.attendanceSettings;
        if (att?.shiftStartTime) {
          punchIn = att.shiftStartTime;
          const startMins = parseAmPmToMinutes(att.shiftStartTime);
          const workingHours = att.workingHours ?? 9;
          punchOut = minutesToAmPm(startMins + workingHours * 60);
        }
      }

      if (shiftRes.ok && meRes.ok) {
        const shiftData = await shiftRes.json();
        const meData = await meRes.json();
        const rosterShift = meData.employee?.rosterShift;
        const matched = (shiftData.shifts || []).find(
          (s: { name: string }) => s.name === rosterShift
        );
        if (matched) {
          punchIn = matched.startTime;
          punchOut = matched.endTime;
          hint = `Pre-filled from your assigned shift: ${matched.name}.`;
        }
      }

      setReqInTime(ampmToInput(punchIn));
      setReqOutTime(ampmToInput(punchOut));
      setShiftHint(hint);
    } catch (err) {
      console.error("Failed to load shift defaults:", err);
    }
  };

  const parseAmPmToMinutes = (timeStr: string) => {
    const parts = timeStr.split(" ");
    if (parts.length !== 2) return 0;
    const [time, modifier] = parts;
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const minutesToAmPm = (totalMinutes: number) => {
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const mod = endH >= 12 ? "PM" : "AM";
    const disp = endH % 12 || 12;
    return `${String(disp).padStart(2, "0")}:${String(endM).padStart(2, "0")} ${mod}`;
  };

  const ampmToInput = (timeStr: string) => {
    if (!timeStr) return "09:00";
    const parts = timeStr.split(" ");
    if (parts.length !== 2) return "09:00";
    const [time, modifier] = parts;
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  const fetchRequests = async () => {
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/attendance/regularization", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(sortByAppliedAtRecentFirst(data.requests || []));
      }
    } catch (err) {
      console.error("Failed to load regularization requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Helper to format HH:MM into HH:MM AM/PM
  const formatTimeToAMPM = (time24: string) => {
    if (!time24) return "";
    const [hoursStr, minutesStr] = time24.split(":");
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesFormatted = minutes < 10 ? "0" + minutes : minutes;
    const hoursFormatted = hours < 10 ? "0" + hours : hours;
    return `${hoursFormatted}:${minutesFormatted} ${ampm}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!reqDate || !reqInTime || !reqOutTime || !reqReason.trim()) {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/attendance/regularization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: reqDate,
          requestedIn: formatTimeToAMPM(reqInTime),
          requestedOut: formatTimeToAMPM(reqOutTime),
          reason: reqReason.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit request");
      }

      const data = await res.json();
      if (data.request) {
        setRequests(sortByAppliedAtRecentFirst([data.request, ...requests]));
        setSuccessMsg("Regularization request submitted successfully!");
        setIsOpen(false);
        setReqDate("");
        setReqReason("");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: "Approved" | "Rejected") => {
    setActionLoadingId(id);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/attendance/regularization/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update status");
      }

      const data = await res.json();
      if (data.request) {
        setRequests(sortByAppliedAtRecentFirst(requests.map((r) => (r.id === id ? { ...r, status } : r))));
        setSuccessMsg(`Request successfully ${status.toLowerCase()}!`);
        setTimeout(() => setSuccessMsg(""), 4000);

        // Re-initialize leave store to reload updated punch logs
        await initialize();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update request status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const myRequests = sortByAppliedAtRecentFirst(
    requests.filter((r) => r.employeeId === currentUser.id)
  );
  const pendingTeamRequests = sortByAppliedAtRecentFirst(
    requests.filter((r) => r.status === "Pending" && r.employeeId !== currentUser.id)
  );
  const allTeamRequests = sortByAppliedAtRecentFirst(
    requests.filter((r) => r.employeeId !== currentUser.id)
  );

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Loading regularization logs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Attendance Regularization"
        title="Punch Adjustments"
        description="If you were late or missed a punch, submit the correct in/out times. Your HR Manager or reporting manager can approve — once accepted, that day's attendance log is updated to your requested times."
        action={{
          label: "Request Correction",
          icon: Plus,
          onClick: () => {
            loadDefaultShiftTimes();
            setIsOpen(true);
          },
        }}
      />

      {/* Tabs Menu (Only if HR/Admin) */}
      {isAuthorized && (
        <div className="flex border-b border-border/40 pb-px gap-6">
          <button
            onClick={() => {
              setActiveTab("my");
              setSuccessMsg("");
              setErrorMsg("");
            }}
            className={`pb-4 text-xs font-bold uppercase tracking-wider relative transition-colors outline-none cursor-pointer ${
              activeTab === "my"
                ? "text-primary font-black"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            My Correction Logs
            {activeTab === "my" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("team");
              setSuccessMsg("");
              setErrorMsg("");
            }}
            className={`pb-4 text-xs font-bold uppercase tracking-wider relative transition-colors outline-none cursor-pointer ${
              activeTab === "team"
                ? "text-primary font-black"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            Team Approvals ({pendingTeamRequests.length})
            {activeTab === "team" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full" />
            )}
          </button>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-xs font-bold text-emerald-400 flex items-center gap-2 max-w-xl animate-in fade-in duration-300">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 text-xs font-bold text-rose-400 max-w-xl animate-in fade-in duration-300">
          {errorMsg}
        </div>
      )}

      {/* MY CORRECTIONS LOG */}
      {(!isAuthorized || activeTab === "my") && (
        <Card className="crm-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
              My Regularization Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {myRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Clock className="h-10 w-10 text-slate-300 mb-4" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No regularization requests logged
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Click "Request Correction" to submit your first adjustment request.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Correction Date</th>
                      <th className="px-6 py-4">Requested Punch In</th>
                      <th className="px-6 py-4">Requested Punch Out</th>
                      <th className="px-6 py-4">Reason / Notes</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Applied Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-sm">
                    {myRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-all"
                      >
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          {new Date(req.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-slate-650 dark:text-slate-300 font-semibold">
                          {req.requestedIn}
                        </td>
                        <td className="px-6 py-4 text-slate-650 dark:text-slate-300 font-semibold">
                          {req.requestedOut}
                        </td>
                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="px-6 py-4">
                          {req.status === "Approved" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-0 hover:bg-emerald-500/10 gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Approved
                            </Badge>
                          ) : req.status === "Rejected" ? (
                            <Badge className="bg-rose-500/10 text-rose-600 border-0 hover:bg-rose-500/10 gap-1">
                              <XCircle className="h-3 w-3" />
                              Rejected
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 border-0 hover:bg-amber-500/10 gap-1">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-slate-400 font-semibold">
                          {new Date(req.appliedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TEAM APPROVALS */}
      {isAuthorized && activeTab === "team" && (
        <Card className="crm-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Pending Shift Corrections
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {allTeamRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <CheckCircle className="h-10 w-10 text-slate-300 mb-4" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No team requests logged
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Correction requests from your team will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Correction Date</th>
                      <th className="px-6 py-4">Requested Punch</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-sm">
                    {allTeamRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-all"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {req.avatarInitials}
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-slate-800 dark:text-white leading-tight">
                                {req.employeeName}
                              </span>
                              <span className="block text-[9px] text-slate-400 font-semibold uppercase">
                                {req.employeeRole} · {req.employeeBranch}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          {new Date(req.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-slate-650 dark:text-slate-300 font-semibold">
                          {req.requestedIn} to {req.requestedOut}
                        </td>
                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="px-6 py-4">
                          {req.status === "Approved" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-0 hover:bg-emerald-500/10 gap-1">
                              Approved
                            </Badge>
                          ) : req.status === "Rejected" ? (
                            <Badge className="bg-rose-500/10 text-rose-600 border-0 hover:bg-rose-500/10 gap-1">
                              Rejected
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 border-0 hover:bg-amber-500/10 gap-1">
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {req.status === "Pending" ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                disabled={actionLoadingId === req.id}
                                onClick={() => handleStatusChange(req.id, "Approved")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider px-3 h-7 border-0"
                              >
                                {actionLoadingId === req.id ? "..." : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={actionLoadingId === req.id}
                                onClick={() => handleStatusChange(req.id, "Rejected")}
                                className="rounded-lg text-[10px] font-bold uppercase tracking-wider px-3 h-7 border-0"
                              >
                                {actionLoadingId === req.id ? "..." : "Reject"}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                              Resolved
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* REQUEST DIALOG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">
              Request Attendance Correction
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Enter the correct punch-in and punch-out times for the day. Defaults are pulled from your assigned shift roster or attendance settings. Once approved, your attendance log for that date will reflect these times.
            </DialogDescription>
            {shiftHint && (
              <p className="text-[10px] font-semibold text-primary/80">{shiftHint}</p>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Correction Date
              </label>
              <Input
                type="date"
                required
                max={new Date().toISOString().split("T")[0]}
                value={reqDate}
                onChange={(e) => setReqDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Requested Punch In
                </label>
                <Input
                  type="time"
                  required
                  value={reqInTime}
                  onChange={(e) => setReqInTime(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Requested Punch Out
                </label>
                <Input
                  type="time"
                  required
                  value={reqOutTime}
                  onChange={(e) => setReqOutTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Reason & Details
              </label>
              <textarea
                value={reqReason}
                onChange={(e) => setReqReason(e.target.value)}
                placeholder="Why is regularization needed for this shift? e.g., System check-in issue, client site visit..."
                rows={3}
                required
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-slate-900"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="rounded-xl font-bold text-xs uppercase tracking-wider h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="btn-primary rounded-xl font-bold text-xs uppercase tracking-wider h-11 border-0"
              >
                {submitting ? "Submitting..." : "Submit Correction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
