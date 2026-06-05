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

  // Access validation: Owner/HR/Admin can see all, regular employee can only see their approved requests
  const isHRorAdminorOwner =
    currentUser.role === "HR Manager" || currentUser.role === "Admin" || currentUser.role === "Owner";

  const canApproveOrReject = (req: any) => {
    if (currentUser.role === "Owner") return true;

    const requester = employees.find((e) => e.id === req.employeeId);
    if (!requester) return false;

    const isManager = requester.reportingManager && currentUser.name.toLowerCase() === requester.reportingManager.toLowerCase();
    const isReportingHR = requester.reportingHR && currentUser.name.toLowerCase() === requester.reportingHR.toLowerCase();

    return !!(isManager || isReportingHR);
  };

  const visibleLeaves = leaves.filter((req) => {
    if (!isHRorAdminorOwner) {
      return req.employeeId === currentUser.id && req.status === "Approved";
    }
    return true;
  });

  const filteredRequests = visibleLeaves.filter((r) => r.status === activeTab);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow={!isHRorAdminorOwner ? "Time Off Registry" : "HR Administrator Dashboard"}
        title="Leave Request Approvals"
        description={!isHRorAdminorOwner ? "View your approved leave applications." : "Review, approve, or decline employee leave applications in real time. Deducts leave allowance upon approval."}
      />

      {/* FILTER TABS */}
      <div className="flex border-b border-border/40 gap-6">
        {(["Pending", "Approved", "Rejected"] as LeaveStatus[]).map((tab) => {
          const count = visibleLeaves.filter((r) => r.status === tab).length;
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
                      : req.type === "Casual"
                      ? "bg-purple-500/10 text-purple-600"
                      : req.type === "WFH"
                      ? "bg-blue-500/10 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                      : "bg-slate-500/10 text-slate-600"
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
                  <>
                    {canApproveOrReject(req) ? (
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
                    ) : (
                      <div className="flex items-center gap-1.5 justify-center py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-900/30 dark:border-slate-800">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Awaiting approval from designated Manager/HR</span>
                      </div>
                    )}
                  </>
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
