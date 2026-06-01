"use client";

import { useState } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLeaveStore, type LeaveStatus } from "@/stores/leave-store";
import {
  ShieldAlert,
  UserCheck,
  Check,
  X,
  Clock,
  Calendar,
  Layers,
  User,
} from "lucide-react";

export default function ApprovalsPage() {
  const {
    currentUser,
    leaves,
    employees,
    approveLeave,
    rejectLeave,
    switchUser,
  } = useLeaveStore();

  const [activeTab, setActiveTab] = useState<LeaveStatus>("Pending");

  // Access validation: Only HR Managers or Admins can access approvals
  const isAuthorized =
    currentUser.role === "HR Manager" || currentUser.role === "Admin";

  const filteredRequests = leaves.filter((r) => r.status === activeTab);

  if (!isAuthorized) {
    // Elegant glassmorphism access restriction card
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 shadow-xl shadow-amber-500/10 dark:bg-amber-950/20 dark:text-amber-400">
          <ShieldAlert className="h-10 w-10" />
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
          Access Restricted
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          You are currently logged in as <span className="font-bold text-slate-700 dark:text-slate-300">{currentUser.name} ({currentUser.role})</span>. 
          Only HR Managers or Administrators have permission to approve leave applications.
        </p>

        <Card className="crm-card max-w-md mt-10 p-6 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50">
          <span className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Switch Employee Account
          </span>
          <div className="grid gap-3">
            {employees
              .filter((e) => e.role === "HR Manager" || e.role === "Admin")
              .map((manager) => (
                <button
                  key={manager.id}
                  onClick={() => switchUser(manager.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200/60 bg-white px-4 py-3 text-left transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {manager.avatarInitials}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-slate-800 dark:text-white">
                        {manager.name}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-medium">
                        {manager.role} · {manager.department}
                      </span>
                    </div>
                  </div>
                  <User className="h-4 w-4 text-slate-400" />
                </button>
              ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="HR Administrator Dashboard"
        title="Leave Request Approvals"
        description="Review, approve, or decline employee leave applications in real time. Deducts leave allowance upon approval."
      />

      {/* FILTER TABS */}
      <div className="flex border-b border-border/40 gap-6">
        {(["Pending", "Approved", "Rejected"] as LeaveStatus[]).map((tab) => {
          const count = leaves.filter((r) => r.status === tab).length;
          const active = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-3 text-sm font-bold transition-all outline-none cursor-pointer ${
                active
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{tab} Requests</span>
                <Badge
                  className={`border-0 shrink-0 font-extrabold ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}
                >
                  {count}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>

      {/* REQUESTS LIST CARDS / TABLE */}
      {filteredRequests.length === 0 ? (
        <Card className="crm-card flex flex-col items-center justify-center p-16 text-center">
          <Layers className="h-10 w-10 text-slate-300 mb-4" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No {activeTab.toLowerCase()} requests
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Excellent! You're completely up to date with this queue.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredRequests.map((req) => (
            <Card
              key={req.id}
              className="crm-card border border-slate-200/50 hover:border-slate-300 dark:border-slate-800"
            >
              <CardHeader className="flex flex-row items-start justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 font-extrabold text-slate-700 text-sm dark:bg-slate-800 dark:text-slate-300">
                    {req.avatarInitials}
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-800 dark:text-white">
                      {req.employeeName}
                    </span>
                    <span className="block text-[11px] text-slate-400 font-semibold">
                      {req.employeeRole}
                    </span>
                  </div>
                </div>

                <Badge
                  className={`border-0 font-bold ${
                    req.type === "Annual"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : req.type === "Sick"
                      ? "bg-sky-500/10 text-sky-600"
                      : "bg-purple-500/10 text-purple-600"
                  }`}
                >
                  {req.type}
                </Badge>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      Requested Period
                    </span>
                    <span className="block font-semibold text-slate-700 mt-1 dark:text-slate-300">
                      {req.startDate} to {req.endDate}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      Duration
                    </span>
                    <span className="block font-bold text-slate-700 mt-1 dark:text-slate-300">
                      {req.totalDays} {req.totalDays === 1 ? "Day" : "Days"}
                      {req.halfDay && " (Half-day)"}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs dark:bg-slate-900/40 dark:border-slate-800">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Employee Reason
                  </span>
                  <p className="leading-relaxed text-slate-600 dark:text-slate-300 italic">
                    "{req.reason || "No comments provided."}"
                  </p>
                </div>

                {req.status === "Pending" && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => approveLeave(req.id)}
                      className="btn-primary flex-1 font-bold text-xs uppercase tracking-wider h-10 border-0"
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => rejectLeave(req.id)}
                      variant="destructive"
                      className="flex-1 font-bold text-xs uppercase tracking-wider h-10 border-0 bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/10 hover:shadow-rose-500/25 transition-all text-white"
                    >
                      <X className="mr-1.5 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}

                {req.status !== "Pending" && (
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-border/40">
                    <span>Decision Applied:</span>
                    <span className="font-bold text-slate-600 dark:text-slate-300">
                      {req.status === "Approved" ? "Approved" : "Rejected"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
