"use client";

import { useState } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLeaveStore, type LeaveType } from "@/stores/leave-store";
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";

export default function LeavePage() {
  const { currentUser, leaves, applyLeave } = useLeaveStore();
  const [open, setOpen] = useState(false);

  // Form State
  const [type, setType] = useState<LeaveType>("Annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Only display leave requests applied by the current user
  const myRequests = leaves.filter((l) => l.employeeId === currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!startDate || !endDate) {
      setErrorMsg("Please select start and end dates.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      setErrorMsg("End date cannot be earlier than start date.");
      return;
    }

    // Calculate total days
    let totalDays = 0;
    if (halfDay) {
      totalDays = 0.5;
    } else {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    // Verify balance
    if (type !== "Unpaid" && type !== "Maternity/Paternity") {
      const balanceType = type as "Annual" | "Sick" | "Casual";
      const available = currentUser.leaveBalance[balanceType];
      if (totalDays > available) {
        setErrorMsg(
          `Insufficient balance! You requested ${totalDays} days, but only have ${available} ${type} leaves left.`
        );
        return;
      }
    }

    applyLeave({
      type,
      startDate,
      endDate,
      totalDays,
      halfDay,
      reason,
    });

    // Reset Form
    setType("Annual");
    setStartDate("");
    setEndDate("");
    setHalfDay(false);
    setReason("");
    setOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Time Off Management"
        title="My Leaves Tracker"
        description="Monitor your active leave balances, submit new requests, and review historical applications."
        action={{
          label: "Apply Leave",
          icon: Plus,
          onClick: () => setOpen(true),
        }}
      />

      {/* LEAVE BALANCES GRID */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="crm-card border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Annual Leave Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800 dark:text-white">
              {currentUser.leaveBalance.Annual} days
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Paid holiday allowance</p>
          </CardContent>
        </Card>

        <Card className="crm-card border-l-4 border-l-sky-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Sick Leave Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800 dark:text-white">
              {currentUser.leaveBalance.Sick} days
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Medical leaves with pay</p>
          </CardContent>
        </Card>

        <Card className="crm-card border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Casual Leave Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800 dark:text-white">
              {currentUser.leaveBalance.Casual} days
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Personal emergencies allowance</p>
          </CardContent>
        </Card>

        <Card className="crm-card border-l-4 border-l-slate-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Total Leaves Taken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800 dark:text-white">
              {myRequests.filter((r) => r.status === "Approved").reduce((acc, curr) => acc + curr.totalDays, 0)} days
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Approved leaves in current cycle</p>
          </CardContent>
        </Card>
      </div>

      {/* REQUESTS LIST TABLE */}
      <Card className="crm-card">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
            My Leave Request Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {myRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <CalendarDays className="h-10 w-10 text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No leave requests found</p>
              <p className="text-xs text-slate-400 mt-1">Start by clicking "Apply Leave" above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Leave Type</th>
                    <th className="px-6 py-4">Duration Dates</th>
                    <th className="px-6 py-4 text-center">Total Days</th>
                    <th className="px-6 py-4">Reason / Notes</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Applied Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-sm">
                  {myRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-all">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                        {req.type}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {req.startDate} to {req.endDate}
                        {req.halfDay && <span className="ml-1.5 text-xs text-amber-500 font-semibold">(Half-day)</span>}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {req.totalDays}
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={req.reason}>
                        {req.reason || "—"}
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

      {/* APPLY LEAVE DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">
              Request Time Off
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Complete the fields below to submit your leave request. Approval requires HR/Manager review.
            </DialogDescription>
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
                Leave Category
              </label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as LeaveType)}
                className="w-full"
              >
                <option value="Annual">Annual (Paid Holiday)</option>
                <option value="Sick">Sick Leave</option>
                <option value="Casual">Casual Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
                <option value="Maternity/Paternity">Maternity/Paternity</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  disabled={halfDay}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="halfDay"
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
                htmlFor="halfDay"
                className="text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer"
              >
                Request as a half-day shift
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Reason & Details
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe your request..."
                rows={3}
                required
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-slate-900"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="rounded-xl font-bold text-xs uppercase tracking-wider h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="btn-primary rounded-xl font-bold text-xs uppercase tracking-wider h-11 border-0"
              >
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
