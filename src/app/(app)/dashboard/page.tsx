"use client";

import { useEffect, useState, useRef } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getWFHBranchError, resolveEmployeeBranch } from "@/lib/branch-utils";
import { useLeaveStore } from "@/stores/leave-store";
import { AttachmentPicker } from "@/components/AttachmentPicker";
import { uploadAttachmentFiles } from "@/lib/storage/client-upload";
import { FaceScanDialog } from "@/components/attendance/FaceScanDialog";
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
  Loader2,
  CalendarDays,
  ChevronDown,
  Check,
  Info,
} from "lucide-react";
import Link from "next/link";

// --- CUSTOM SELECT COMPONENT ---
interface CustomSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  colorPreview?: string;
}

interface CustomSelectProps {
  label: string;
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

function CustomSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select option"
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const getColorStyle = (color?: string) => {
    if (!color) return {};
    if (color.startsWith("#") || color.startsWith("rgb")) {
      return { backgroundColor: color };
    }
    return {};
  };

  const getColorClass = (color?: string) => {
    if (!color) return "";
    if (color.startsWith("#") || color.startsWith("rgb")) {
      return "";
    }
    if (color.startsWith("bg-")) {
      return color;
    }
    return `bg-${color}-500`;
  };

  return (
    <div className="relative w-full" ref={selectRef}>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-card dark:bg-slate-900 px-3.5 py-2 text-xs outline-none focus:border-primary/45 cursor-pointer select-none text-left transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOption?.colorPreview && (
            <div
              className={`h-2.5 w-2.5 rounded-full ${getColorClass(selectedOption.colorPreview)} ring-2 ring-white dark:ring-slate-950 shrink-0`}
              style={getColorStyle(selectedOption.colorPreview)}
            />
          )}
          {selectedOption?.icon && (
            <span className="text-slate-400 shrink-0">{selectedOption.icon}</span>
          )}
          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-250 shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl border border-border bg-card/95 dark:bg-slate-900/95 shadow-xl backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-top-1.5 duration-200 max-h-60 overflow-y-auto">
          <div className="p-1.5 space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-slate-650 dark:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {opt.colorPreview && (
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${getColorClass(opt.colorPreview)} ring-2 ring-white dark:ring-slate-950 shrink-0 shadow-sm`}
                        style={getColorStyle(opt.colorPreview)}
                      />
                    )}
                    {opt.icon && (
                      <span className={`shrink-0 ${isSelected ? "text-primary" : "text-slate-400"}`}>{opt.icon}</span>
                    )}
                    <div className="min-w-0">
                      <span className="block truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="block text-[9px] text-slate-450 dark:text-slate-450 font-normal mt-0.5 truncate leading-none">
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const getBorderColorStyle = (color?: string) => {
  if (!color) return {};
  if (color.startsWith("#") || color.startsWith("rgb")) {
    return { borderLeftColor: color };
  }
  return {};
};

const getBorderColorClass = (color?: string) => {
  if (!color) return "border-l-slate-400";
  if (color.startsWith("#") || color.startsWith("rgb")) {
    return "";
  }
  if (color.startsWith("border-l-")) {
    return color;
  }
  if (color.startsWith("bg-")) {
    return color.replace("bg-", "border-l-");
  }
  return `border-l-${color}-500`;
};

export default function DashboardPage() {
  const {
    currentUser,
    dashboardLeaves: leaves,
    punchHistory,
    currentPunchIn,
    punchIn,
    punchOut,
    dashboardEmployees: employees,
    faceEnrolled,
    applyLeave,
  } = useLeaveStore();

  // Apply Leave form state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [applying, setApplying] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  // Holidays, branches, and customLeaveTypes for leave calculations & validations
  const [holidays, setHolidays] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [customLeaveTypes, setCustomLeaveTypes] = useState<any[]>([]);

  // Load holidays, branches, and custom leave categories
  useEffect(() => {
    const loadData = async () => {
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

      // Fetch custom leave categories
      try {
        const res = await fetch("/api/settings/leave-category", { headers });
        if (res.ok) {
          const data = await res.json();
          const cats = data.leaveCategories || [];
          setCustomLeaveTypes(cats);
          if (cats.length > 0) {
            setLeaveType(cats[0].name);
          }
        }
      } catch (err) {
        console.error("Failed to load leave categories:", err);
      }
    };
    loadData();
  }, []);

  const selectOptions: CustomSelectOption[] = customLeaveTypes
    .filter((cat) => {
      if (!cat.branchId || cat.branchId === "All") return true;
      if (!currentUser?.branch) return false;
      return cat.branchId.toLowerCase() === currentUser.branch.toLowerCase();
    })
    .map((cat) => ({
      value: cat.name,
      label: `${cat.name} (${cat.days} Days)`,
      description: cat.description || "Custom leave category",
      colorPreview: cat.color || "bg-primary-500",
    }));

  const getExcludedHolidays = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return [];
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (end < start) return [];

    return holidays.filter((h) => {
      const hDate = new Date(h.date);
      const matchesBranch = !h.branchId || h.branchId === "All" || h.branchId === currentUser.branch;
      return h.type === "Gazetted" && matchesBranch && hDate >= start && hDate <= end;
    });
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
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
      const calendarDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const excluded = getExcludedHolidays(startDate, endDate);
      totalDays = Math.max(0, calendarDays - excluded.length);
    }

    if (leaveType === "WFH") {
      const branchError = getWFHBranchError(
        resolveEmployeeBranch(
          { branch: currentUser.branch, workLocation: currentUser.workLocation },
          branches
        )
      );
      if (branchError) {
        setErrorMsg(branchError);
        return;
      }
    }

    // Verify balance
    const isMainLeaveType = leaveType === "Annual" || leaveType === "Sick" || leaveType === "Casual";
    if (isMainLeaveType) {
      const balanceType = leaveType as "Annual" | "Sick" | "Casual";
      const available = currentUser.leaveBalance[balanceType];
      if (totalDays > available) {
        setErrorMsg(
          `Insufficient balance! You requested ${totalDays} days, but only have ${available} ${leaveType} leaves left.`
        );
        return;
      }
    } else {
      const customType = customLeaveTypes.find((cat) => cat.name === leaveType);
      if (customType) {
        const approvedDaysTaken = leaves
          .filter((r) => r.type === leaveType && r.status === "Approved")
          .reduce((acc, curr) => acc + curr.totalDays, 0);
        const available = customType.days - approvedDaysTaken;
        if (totalDays > available) {
          setErrorMsg(
            `Insufficient balance! You requested ${totalDays} days, but only have ${available} ${leaveType} leaves left.`
          );
          return;
        }
      }
    }

    setApplying(true);
    try {
      let attachments: string[] = [];
      if (attachmentFiles.length > 0) {
        attachments = await uploadAttachmentFiles(attachmentFiles, "leaves");
      }

      await applyLeave({
        type: leaveType,
        startDate,
        endDate,
        totalDays,
        halfDay,
        reason,
        attachments,
      });

      // Reset Form & Close Modal
      if (customLeaveTypes.length > 0) {
        setLeaveType(customLeaveTypes[0].name);
      } else {
        setLeaveType("");
      }
      setStartDate("");
      setEndDate("");
      setHalfDay(false);
      setReason("");
      setAttachmentFiles([]);
      setIsLeaveModalOpen(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to apply for leave. Please try again."
      );
    } finally {
      setApplying(false);
    }
  };

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
            {customLeaveTypes.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No leave types defined yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-center max-h-48 overflow-y-auto pr-1">
                {customLeaveTypes
                  .filter((cat) => {
                    if (!cat.branchId || cat.branchId === "All") return true;
                    if (!currentUser?.branch) return false;
                    return cat.branchId.toLowerCase() === currentUser.branch.toLowerCase();
                  })
                  .map((cat) => {
                    const approvedDaysTaken = leaves
                      .filter((r) => r.type === cat.name && r.status === "Approved")
                      .reduce((acc, curr) => acc + curr.totalDays, 0);
                    const balance = cat.days - approvedDaysTaken;
                    const borderClass = getBorderColorClass(cat.color);
                    const borderStyle = getBorderColorStyle(cat.color);
                    
                    return (
                      <div
                        key={cat.id}
                        className={`rounded-xl p-3 border-l-4 ${borderClass} border bg-slate-50/50 dark:bg-slate-950/20`}
                        style={borderStyle}
                      >
                        <span className="block text-xl font-extrabold text-slate-800 dark:text-white leading-tight">
                          {balance}
                        </span>
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block mt-0.5 truncate" title={cat.name}>
                          {cat.name}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
 
            <div className="mt-5">
              <Button
                onClick={() => {
                  setErrorMsg("");
                  if (customLeaveTypes.length > 0) {
                    setLeaveType(customLeaveTypes[0].name);
                  } else {
                    setLeaveType("");
                  }
                  setStartDate("");
                  setEndDate("");
                  setHalfDay(false);
                  setReason("");
                  setIsLeaveModalOpen(true);
                }}
                className="w-full h-10 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer"
              >
                Request New Leave
              </Button>
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
        onSuccess={async (selfieBase64, lat, lng) => {
          if (pendingAction === "punch-in") {
            await punchIn(selfieBase64, lat, lng);
          } else if (pendingAction === "punch-out") {
            await punchOut(selfieBase64, lat, lng);
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

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsFaceRequiredAlertOpen(false)}
              className="modal-action-btn w-full border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Link href="/settings/profile" className="w-full block">
              <Button className="modal-action-btn btn-primary w-full border-0">
                Go to Face Setup
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* APPLY LEAVE DIALOG */}
      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-3xl border border-border/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span>Apply for Leave</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleLeaveSubmit} className="space-y-4 pt-3">
            {errorMsg && (
              <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 text-xs font-bold text-rose-500 animate-in fade-in duration-200">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <CustomSelect
                label="Leave Category"
                value={leaveType}
                onChange={(val) => setLeaveType(val)}
                options={selectOptions}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (halfDay) {
                      setEndDate(e.target.value);
                    }
                  }}
                  className="block w-full rounded-2xl border border-border bg-transparent dark:bg-slate-900 px-4 py-3 text-xs text-slate-850 dark:text-slate-100 outline-none focus:border-primary/45 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={halfDay}
                  className="block w-full rounded-2xl border border-border bg-transparent dark:bg-slate-900 px-4 py-3 text-xs text-slate-850 dark:text-slate-100 outline-none focus:border-primary/45 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Show holiday overlap message if any */}
            {!halfDay && startDate && endDate && (() => {
              const excluded = getExcludedHolidays(startDate, endDate);
              if (excluded.length > 0) {
                return (
                  <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                    <Info className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold">Excludes {excluded.length} official company holiday(s):</span>
                      <ul className="list-disc pl-4 font-semibold space-y-0.5">
                        {excluded.map((h) => (
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

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="halfDayCheckbox"
                checked={halfDay}
                onChange={(e) => {
                  setHalfDay(e.target.checked);
                  if (e.target.checked && startDate) {
                    setEndDate(startDate);
                  }
                }}
                className="rounded border-slate-300 text-primary focus:ring-primary accent-primary h-4 w-4 cursor-pointer"
              />
              <label htmlFor="halfDayCheckbox" className="text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none">
                Apply as a Half-Day Leave
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Reason / Explanation
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief description of the reason for your time-off request..."
                className="block w-full rounded-2xl border border-border bg-transparent dark:bg-slate-900 px-4 py-3 text-xs text-slate-850 dark:text-slate-100 outline-none focus:border-primary/45 resize-none placeholder:text-slate-400/80"
              />
            </div>

            <AttachmentPicker
              files={attachmentFiles}
              onChange={setAttachmentFiles}
              disabled={applying}
            />

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="modal-action-btn w-full border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={applying}
                className="modal-action-btn btn-primary w-full border-0 cursor-pointer"
              >
                {applying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
