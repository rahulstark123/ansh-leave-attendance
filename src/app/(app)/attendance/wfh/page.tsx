"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLeaveStore } from "@/stores/leave-store";
import { getWFHBranchError, resolveEmployeeBranch } from "@/lib/branch-utils";
import { sortByAppliedAtRecentFirst } from "@/lib/sort-recent-first";
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Home,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WFHRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  avatarInitials: string;
  employeeBranch: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  halfDay: boolean;
  reason: string;
  status: string; // "Pending" | "Approved" | "Rejected"
  appliedAt: string;
}

export default function WFHPage() {
  const { currentUser, initialize } = useLeaveStore();
  const isAuthorized =
    currentUser?.role === "HR Manager" ||
    currentUser?.role === "Admin" ||
    currentUser?.role === "Owner";

  const [activeTab, setActiveTab] = useState<"my" | "team">("my");
  const [requests, setRequests] = useState<WFHRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("");

  // System reference states
  const [holidays, setHolidays] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const fetchRequests = async () => {
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/attendance/wfh", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(sortByAppliedAtRecentFirst(data.requests || []));
      }
    } catch (err) {
      console.error("Failed to load WFH requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemData = async () => {
    const token = sessionStorage.getItem("ansh_auth_token");
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch holidays
    try {
      const res = await fetch("/api/settings/holiday", { headers });
      if (res.ok) {
        const data = await res.json();
        setHolidays(data.holidays || []);
      }
    } catch (err) {
      console.error("Failed to load holidays:", err);
    }

    // Fetch branches
    try {
      const res = await fetch("/api/settings", { headers });
      if (res.ok) {
        const data = await res.json();
        setBranches(data.settings?.branches || []);
      }
    } catch (err) {
      console.error("Failed to load branches:", err);
    }
  };

  useEffect(() => {
    initialize().finally(() => {
      fetchRequests();
      fetchSystemData();
    });
  }, [initialize]);

  // Helper to count Gazetted holidays overlapping in selected range that apply to user's branch
  const getExcludedHolidays = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return [];
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (end < start) return [];

    return holidays.filter((h) => {
      const hDate = new Date(h.date);
      const matchesBranch = !h.branchId || h.branchId === "All" || h.branchId === currentUser?.branch;
      return h.type === "Gazetted" && matchesBranch && hDate >= start && hDate <= end;
    });
  };

  // Helper to calculate total days excluding weekends and official holidays
  const calculateTotalDays = (startStr: string, endStr: string, isHalf: boolean) => {
    if (!startStr || !endStr) return 0;
    if (isHalf) return 0.5;

    const start = new Date(startStr);
    const end = new Date(endStr);
    if (end < start) return 0;

    let count = 0;
    const current = new Date(start);
    const excludedHolidays = getExcludedHolidays(startStr, endStr);
    const holidayDates = new Set(excludedHolidays.map((h) => h.date));

    while (current <= end) {
      const day = current.getDay();
      const dateStr = current.toISOString().split("T")[0];
      
      // Count if not Saturday (6), Sunday (0), and not in excluded holidays
      if (day !== 0 && day !== 6 && !holidayDates.has(dateStr)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!startDate || !endDate || !reason.trim()) {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      setErrorMsg("End date cannot be earlier than start date.");
      return;
    }

    const totalDays = calculateTotalDays(startDate, endDate, halfDay);
    if (totalDays <= 0) {
      setErrorMsg("The selected date range does not contain any active workdays (weekends or holidays).");
      return;
    }

    const branchError = getWFHBranchError(
      resolveEmployeeBranch(
        {
          branch: currentUser?.branch,
          workLocation: currentUser?.workLocation,
        },
        branches
      )
    );
    if (branchError) {
      setErrorMsg(branchError);
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/attendance/wfh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate,
          endDate,
          totalDays,
          halfDay,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit request");
      }

      const data = await res.json();
      if (data.request) {
        setRequests(sortByAppliedAtRecentFirst([data.request, ...requests]));
        setSuccessMsg("WFH request submitted successfully!");
        setIsOpen(false);
        setStartDate("");
        setEndDate("");
        setHalfDay(false);
        setReason("");
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
      const res = await fetch("/api/attendance/wfh/status", {
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
        setSuccessMsg(`WFH request successfully ${status.toLowerCase()}!`);
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
    requests.filter((r) => r.employeeId === currentUser?.id)
  );
  const pendingTeamRequests = sortByAppliedAtRecentFirst(
    requests.filter((r) => r.status === "Pending" && r.employeeId !== currentUser?.id)
  );
  const allTeamRequests = sortByAppliedAtRecentFirst(
    requests.filter((r) => r.employeeId !== currentUser?.id)
  );

  const activeDaysCount = calculateTotalDays(startDate, endDate, halfDay);
  const excludedHolidays = getExcludedHolidays(startDate, endDate);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Loading WFH requests...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Work Location Management"
        title="Work From Home"
        description="Apply for WFH shifts, monitor application statuses, and approve team location updates."
        action={{
          label: "Apply WFH",
          icon: Plus,
          onClick: () => setIsOpen(true),
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
            My WFH Logs
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

      {/* MY REQUESTS */}
      {(!isAuthorized || activeTab === "my") && (
        <Card className="crm-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
              My WFH Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {myRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Home className="h-10 w-10 text-slate-300 mb-4" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No Work From Home requests logged
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Click "Apply WFH" to submit your first location request.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Period Dates</th>
                      <th className="px-6 py-4 text-center">Total Workdays</th>
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
                          {new Date(req.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })} to {new Date(req.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {req.halfDay && <span className="ml-1.5 text-xs text-amber-500 font-semibold">(Half-day)</span>}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-650 dark:text-slate-300 font-semibold">
                          {req.totalDays} {req.totalDays === 1 ? "day" : "days"}
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
              Pending Team WFH Requests
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
                  WFH requests from your team will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Period Dates</th>
                      <th className="px-6 py-4 text-center">Total Workdays</th>
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
                          {new Date(req.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })} to {new Date(req.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {req.halfDay && <span className="ml-1.5 text-xs text-amber-500 font-semibold">(Half-day)</span>}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-650 dark:text-slate-300 font-semibold">
                          {req.totalDays} {req.totalDays === 1 ? "day" : "days"}
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

      {/* REQUEST WFH DIALOG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Apply Work From Home
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Submit a WFH request. Upon approval, attendance punch records will be auto-generated for workdays in the range.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Start Date
                </label>
                <Input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (halfDay) {
                      setEndDate(e.target.value);
                    }
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  End Date
                </label>
                <Input
                  type="date"
                  required
                  value={endDate}
                  disabled={halfDay}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Overlap with Holidays display */}
            {!halfDay && startDate && endDate && (() => {
              if (excludedHolidays.length > 0) {
                return (
                  <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                    <Info className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold">Excludes {excludedHolidays.length} official company holiday(s):</span>
                      <ul className="list-disc pl-4 font-semibold space-y-0.5">
                        {excludedHolidays.map((h) => (
                          <li key={h.id}>
                            {h.name} ({new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Day breakdown display */}
            {startDate && endDate && (
              <div className="p-3 bg-slate-55/50 rounded-xl border border-border/40 text-xs font-semibold flex items-center justify-between text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-900/60">
                <span>Calculated Active Workdays:</span>
                <span className="font-extrabold text-primary">
                  {activeDaysCount} {activeDaysCount === 1 ? "Day" : "Days"}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="halfDayWFH"
                checked={halfDay}
                onChange={(e) => {
                  setHalfDay(e.target.checked);
                  if (e.target.checked && startDate) {
                    setEndDate(startDate); // If half-day, end date matches start date
                  }
                }}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
              <label
                htmlFor="halfDayWFH"
                className="text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer animate-in duration-200"
              >
                Request as a half-day WFH
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Reason & Details
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you need to work from home? e.g. Personal work at house, health recovery..."
                rows={3}
                required
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-slate-900"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border/40">
              <div className="grid grid-cols-2 gap-3 w-full">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-xl font-bold text-xs uppercase tracking-wider h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full rounded-xl font-bold text-xs uppercase tracking-wider h-11 border-0"
                >
                  {submitting ? "Submitting..." : "Apply WFH"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
