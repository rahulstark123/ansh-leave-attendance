"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLeaveStore, type LeaveType } from "@/stores/leave-store";
import { sortByAppliedAtRecentFirst } from "@/lib/sort-recent-first";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Info,
  ChevronDown,
  Check,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

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
                      : "text-slate-600 dark:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
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
                        <span className="block text-[9px] text-slate-450 dark:text-slate-400 font-normal mt-0.5 truncate leading-none">
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

// --- ACTIONS MENU COMPONENT ---
interface LeaveRequestActionsMenuProps {
  request: any;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function LeaveRequestActionsMenu({ request, onPreview, onEdit, onDelete }: LeaveRequestActionsMenuProps) {
  const isPending = request.status === "Pending";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:text-slate-350 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer outline-none flex items-center justify-center"
        title="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-32 bg-card/95 dark:bg-slate-950/95 shadow-2xl backdrop-blur-md border border-border dark:border-slate-700/80 p-1 space-y-0.5 select-none z-[100] animate-in fade-in slide-in-from-top-1 duration-150">
        <DropdownMenuItem
          onClick={onPreview}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer outline-none"
        >
          <Eye className="h-3.5 w-3.5 text-slate-400 dark:text-slate-350" />
          <span>Preview</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={!isPending}
          onClick={() => isPending && onEdit()}
          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-all outline-none ${
            isPending
              ? "text-slate-650 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer"
              : "text-slate-400/50 dark:text-slate-650 cursor-not-allowed opacity-50"
          }`}
          title={!isPending ? "Only pending requests can be edited" : undefined}
        >
          <Edit className="h-3.5 w-3.5 text-slate-400 dark:text-slate-350" />
          <span>Edit</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border/40 dark:bg-slate-800/50 my-0.5" />

        <DropdownMenuItem
          disabled={!isPending}
          onClick={() => isPending && onDelete()}
          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-all outline-none ${
            isPending
              ? "text-rose-500 hover:bg-rose-500/10 cursor-pointer"
              : "text-rose-500/30 dark:text-rose-950 cursor-not-allowed opacity-50"
          }`}
          title={!isPending ? "Only pending requests can be deleted" : undefined}
        >
          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const formatDateRange = (startStr: string, endStr: string) => {
  if (!startStr) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const formatDate = (dateStr: string) => {
    const normalized = dateStr.replace(/\//g, "-");
    const parts = normalized.split("-");
    if (parts.length !== 3) return dateStr;
    
    let dayStr = parts[2];
    let monthStr = parts[1];
    
    // Simple check in case format is DD-MM-YYYY
    if (parts[0].length !== 4 && parts[2].length === 4) {
      dayStr = parts[0];
      monthStr = parts[1];
    }
    
    const day = parseInt(dayStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;
    const month = months[monthIndex] || "";
    return `${day} ${month}`;
  };

  const formattedStart = formatDate(startStr);
  if (!endStr || startStr === endStr) {
    return formattedStart;
  }
  const formattedEnd = formatDate(endStr);
  return `${formattedStart} - ${formattedEnd}`;
};

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

export default function LeavePage() {
  const { currentUser, leaves, applyLeave, updateLeave, deleteLeave } = useLeaveStore();
  const [open, setOpen] = useState(false);

  // Form State (Apply)
  const [type, setType] = useState<LeaveType>("Annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Edit State
  const [editOpen, setEditOpen] = useState(false);
  const [editRequest, setEditRequest] = useState<any | null>(null);
  const [editType, setEditType] = useState<LeaveType>("Annual");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editHalfDay, setEditHalfDay] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [editErrorMsg, setEditErrorMsg] = useState("");

  // Delete & Preview Dialog States
  const [previewRequest, setPreviewRequest] = useState<any | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<any | null>(null);

  // Holidays and branches state
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [customLeaveTypes, setCustomLeaveTypes] = useState<any[]>([]);

  // Fetch company holidays & branches
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
      } finally {
        setLoadingHolidays(false);
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
          setCustomLeaveTypes(data.leaveCategories || []);
        }
      } catch (err) {
        console.error("Failed to load leave categories:", err);
      }
    };
    loadData();
  }, []);

  // Helper to count Gazetted holidays overlapping in selected range that apply to user's branch
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

  // Only display leave requests applied by the current user
  const myRequests = leaves.filter((l) => l.employeeId === currentUser.id);

  const [timeFilter, setTimeFilter] = useState<string>("This Week");

  const isDateWithinRange = (dateInput: string | Date, range: string) => {
    const d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (range === "Today") {
      return d.getTime() === today.getTime();
    }

    if (range === "This Week") {
      const day = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - day);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return d >= startOfWeek && d <= endOfWeek;
    }

    if (range === "This Month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return d >= startOfMonth && d <= endOfMonth;
    }

    if (range === "Last 3 Months") {
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      threeMonthsAgo.setHours(0, 0, 0, 0);
      return d >= threeMonthsAgo && d <= today;
    }

    return true; // All Time
  };

  const filteredRequests = sortByAppliedAtRecentFirst(
    myRequests.filter((req) => isDateWithinRange(req.appliedAt, timeFilter))
  );

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedRequests = filteredRequests.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  // Custom Select Options definition
  const selectOptions: CustomSelectOption[] = [
    { value: "Annual", label: "Annual (Paid Holiday)", description: "Paid holiday allowance", colorPreview: "bg-emerald-500" },
    { value: "Sick", label: "Sick Leave", description: "Medical leaves with pay", colorPreview: "bg-sky-500" },
    { value: "Casual", label: "Casual Leave", description: "Personal emergencies allowance", colorPreview: "bg-purple-500" },
    { value: "Unpaid", label: "Unpaid Leave", description: "Time off without salary", colorPreview: "bg-slate-400" },
    ...customLeaveTypes
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
      })),
  ];

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
      const calendarDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const excluded = getExcludedHolidays(startDate, endDate);
      totalDays = Math.max(0, calendarDays - excluded.length);
    }

    // Validate if WFH is allowed for user's branch
    if (type === "WFH") {
      const userBranchName = currentUser.branch;
      if (!userBranchName) {
        setErrorMsg("You are not assigned to any office branch. WFH requests are restricted.");
        return;
      }
      const userBranch = branches.find(
        (b) => b.name.toLowerCase() === userBranchName.toLowerCase()
      );
      if (!userBranch) {
        setErrorMsg(`Your assigned branch "${userBranchName}" was not found in system settings.`);
        return;
      }
      if (userBranch.allowWFH === false) {
        setErrorMsg(`Work From Home is not allowed for your branch: ${userBranchName}`);
        return;
      }
    }

    // Verify balance
    const isMainLeaveType = type === "Annual" || type === "Sick" || type === "Casual";
    if (isMainLeaveType) {
      const balanceType = type as "Annual" | "Sick" | "Casual";
      const available = currentUser.leaveBalance[balanceType];
      if (totalDays > available) {
        setErrorMsg(
          `Insufficient balance! You requested ${totalDays} days, but only have ${available} ${type} leaves left.`
        );
        return;
      }
    } else {
      const customType = customLeaveTypes.find((cat) => cat.name === type);
      if (customType) {
        const approvedDaysTaken = myRequests
          .filter((r) => r.type === type && r.status === "Approved")
          .reduce((acc, curr) => acc + curr.totalDays, 0);
        const available = customType.days - approvedDaysTaken;
        if (totalDays > available) {
          setErrorMsg(
            `Insufficient balance! You requested ${totalDays} days, but only have ${available} ${type} leaves left.`
          );
          return;
        }
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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrorMsg("");

    if (!editStartDate || !editEndDate) {
      setEditErrorMsg("Please select start and end dates.");
      return;
    }

    const start = new Date(editStartDate);
    const end = new Date(editEndDate);

    if (end < start) {
      setEditErrorMsg("End date cannot be earlier than start date.");
      return;
    }

    // Calculate total days
    let totalDays = 0;
    if (editHalfDay) {
      totalDays = 0.5;
    } else {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const calendarDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const excluded = getExcludedHolidays(editStartDate, editEndDate);
      totalDays = Math.max(0, calendarDays - excluded.length);
    }

    // Validate if WFH is allowed for user's branch
    if (editType === "WFH") {
      const userBranchName = currentUser.branch;
      if (!userBranchName) {
        setEditErrorMsg("You are not assigned to any office branch. WFH requests are restricted.");
        return;
      }
      const userBranch = branches.find(
        (b) => b.name.toLowerCase() === userBranchName.toLowerCase()
      );
      if (!userBranch) {
        setEditErrorMsg(`Your assigned branch "${userBranchName}" was not found in system settings.`);
        return;
      }
      if (userBranch.allowWFH === false) {
        setEditErrorMsg(`Work From Home is not allowed for your branch: ${userBranchName}`);
        return;
      }
    }

    // Verify balance
    const isMainLeaveType = editType === "Annual" || editType === "Sick" || editType === "Casual";
    if (isMainLeaveType) {
      const balanceType = editType as "Annual" | "Sick" | "Casual";
      const available = currentUser.leaveBalance[balanceType];
      if (totalDays > available) {
        setEditErrorMsg(
          `Insufficient balance! You requested ${totalDays} days, but only have ${available} ${editType} leaves left.`
        );
        return;
      }
    } else {
      const customType = customLeaveTypes.find((cat) => cat.name === editType);
      if (customType) {
        const approvedDaysTaken = myRequests
          .filter((r) => r.type === editType && r.status === "Approved" && r.id !== editRequest?.id)
          .reduce((acc, curr) => acc + curr.totalDays, 0);
        const available = customType.days - approvedDaysTaken;
        if (totalDays > available) {
          setEditErrorMsg(
            `Insufficient balance! You requested ${totalDays} days, but only have ${available} ${editType} leaves left.`
          );
          return;
        }
      }
    }

    if (editRequest) {
      updateLeave(editRequest.id, {
        type: editType,
        startDate: editStartDate,
        endDate: editEndDate,
        totalDays,
        halfDay: editHalfDay,
        reason: editReason,
      });
    }

    // Reset State
    setEditOpen(false);
    setEditRequest(null);
  };

  const handleDeleteConfirm = () => {
    if (requestToDelete) {
      deleteLeave(requestToDelete.id);
      setRequestToDelete(null);
    }
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
        toolbar={
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Filter:</span>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-10 w-40 items-center justify-between rounded-xl border border-border bg-card dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer select-none">
                <span>{timeFilter}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-card/95 dark:bg-slate-950/95 shadow-2xl backdrop-blur-md border border-border dark:border-slate-700/80 p-1 space-y-0.5 select-none z-[100] animate-in fade-in slide-in-from-top-1 duration-150">
                {["Today", "This Week", "This Month", "Last 3 Months", "All Time"].map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => {
                      setTimeFilter(option);
                      setCurrentPage(1); // Reset page on filter change
                    }}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all cursor-pointer outline-none ${
                      timeFilter === option
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-slate-650 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <span>{option}</span>
                    {timeFilter === option && <Check className="h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* LEAVE BALANCES GRID */}
      <div className="flex flex-wrap gap-6">
        <Card className="crm-card border-l-4 border-l-emerald-500 w-full sm:w-[200px]">
          <CardContent className="p-4 flex flex-col items-start gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Annual Leave
            </span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
              {currentUser.leaveBalance.Annual} days
            </span>
          </CardContent>
        </Card>

        <Card className="crm-card border-l-4 border-l-sky-500 w-full sm:w-[200px]">
          <CardContent className="p-4 flex flex-col items-start gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sick Leave
            </span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
              {currentUser.leaveBalance.Sick} days
            </span>
          </CardContent>
        </Card>

        <Card className="crm-card border-l-4 border-l-purple-500 w-full sm:w-[200px]">
          <CardContent className="p-4 flex flex-col items-start gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Casual Leave
            </span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
              {currentUser.leaveBalance.Casual} days
            </span>
          </CardContent>
        </Card>

        {customLeaveTypes
          .filter((cat) => {
            if (!cat.branchId || cat.branchId === "All") return true;
            if (!currentUser?.branch) return false;
            return cat.branchId.toLowerCase() === currentUser.branch.toLowerCase();
          })
          .map((cat) => {
            const approvedDaysTaken = myRequests
              .filter((r) => r.type === cat.name && r.status === "Approved")
              .reduce((acc, curr) => acc + curr.totalDays, 0);
            const balance = cat.days - approvedDaysTaken;
            const borderClass = getBorderColorClass(cat.color);
            const borderStyle = getBorderColorStyle(cat.color);

            return (
              <Card 
                key={cat.id} 
                className={`crm-card border-l-4 ${borderClass} w-full sm:w-[200px]`}
                style={borderStyle}
              >
                <CardContent className="p-4 flex flex-col items-start gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {cat.name}
                  </span>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {balance} day{balance !== 1 ? "s" : ""}
                  </span>
                </CardContent>
              </Card>
            );
          })}

        <Card className="crm-card border-l-4 border-l-slate-400 w-full sm:w-[200px]">
          <CardContent className="p-4 flex flex-col items-start gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Leaves Taken
            </span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
              {myRequests.filter((r) => r.status === "Approved").reduce((acc, curr) => acc + curr.totalDays, 0)} days
            </span>
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
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <CalendarDays className="h-10 w-10 text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No leave requests found</p>
              <p className="text-xs text-slate-400 mt-1">Start by clicking "Apply Leave" above.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Leave Type</th>
                    <th className="px-6 py-4">Duration Dates</th>
                    <th className="px-6 py-4 text-center">Total Days</th>
                    <th className="px-6 py-4">Reason / Notes</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Applied Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-sm">
                  {paginatedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-all">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                        {req.type}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {formatDateRange(req.startDate, req.endDate)}
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
                      <td className="px-6 py-4 text-xs text-slate-400 font-semibold">
                        {new Date(req.appliedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <LeaveRequestActionsMenu
                          request={req}
                          onPreview={() => setPreviewRequest(req)}
                          onEdit={() => {
                            setEditRequest(req);
                            setEditType(req.type);
                            setEditStartDate(req.startDate);
                            setEditEndDate(req.endDate);
                            setEditHalfDay(req.halfDay);
                            setEditReason(req.reason);
                            setEditErrorMsg("");
                            setEditOpen(true);
                          }}
                          onDelete={() => setRequestToDelete(req)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/40 px-6 py-4 bg-slate-50/30 dark:bg-slate-900/10">
                <div className="text-xs text-slate-400 font-semibold">
                  Showing <span className="font-bold text-slate-700 dark:text-slate-300">{((activePage - 1) * itemsPerPage) + 1}</span> to{" "}
                  <span className="font-bold text-slate-700 dark:text-slate-300">{Math.min(activePage * itemsPerPage, filteredRequests.length)}</span> of{" "}
                  <span className="font-bold text-slate-700 dark:text-slate-300">{filteredRequests.length}</span> requests
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={activePage === 1}
                    className="h-8 rounded-lg text-xs font-bold px-3 py-1 cursor-pointer select-none"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={activePage === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 rounded-lg text-xs font-bold cursor-pointer select-none p-0 ${
                          activePage === page
                            ? "bg-primary text-primary-foreground border-0 hover:bg-primary/90"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={activePage === totalPages}
                    className="h-8 rounded-lg text-xs font-bold px-3 py-1 cursor-pointer select-none"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
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
              <CustomSelect
                label="Leave Category"
                value={type}
                onChange={(val) => setType(val as LeaveType)}
                options={selectOptions}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (halfDay) {
                      setEndDate(e.target.value);
                    }
                  }}
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
              <div className="grid grid-cols-2 gap-3 w-full">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="rounded-xl font-bold text-xs uppercase tracking-wider h-11 w-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-primary rounded-xl font-bold text-xs uppercase tracking-wider h-11 border-0 w-full"
                >
                  Submit Request
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PREVIEW LEAVE DETAILS DIALOG */}
      <Dialog open={!!previewRequest} onOpenChange={(isOpen) => !isOpen && setPreviewRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">
              Leave Request Details
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Read-only view of the submitted leave application.
            </DialogDescription>
          </DialogHeader>

          {previewRequest && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leave Category</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{previewRequest.type}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</span>
                  <div className="mt-1">
                    {previewRequest.status === "Approved" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-0 hover:bg-emerald-500/10 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Approved
                      </Badge>
                    ) : previewRequest.status === "Rejected" ? (
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
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Date</span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">{previewRequest.startDate}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">End Date</span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">{previewRequest.endDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Duration</span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
                    {previewRequest.totalDays} day{previewRequest.totalDays > 1 ? "s" : ""}
                    {previewRequest.halfDay && <span className="ml-1 text-xs text-amber-500 font-semibold">(Half-day)</span>}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Applied On</span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
                    {new Date(previewRequest.appliedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reason / Notes</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-xl border border-border/50 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {previewRequest.reason || "No description provided."}
                </p>
              </div>

              <DialogFooter className="pt-4 border-t border-border/40">
                <Button
                  type="button"
                  onClick={() => setPreviewRequest(null)}
                  className="w-full btn-primary rounded-xl font-bold text-xs uppercase tracking-wider h-11 border-0"
                >
                  Close Detail View
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!requestToDelete} onOpenChange={(isOpen) => !isOpen && setRequestToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-955/20 text-rose-505 mb-2">
              <AlertTriangle className="h-6 w-6 text-rose-500" />
            </div>
            <DialogTitle className="text-xl font-extrabold tracking-tight text-center">
              Cancel Leave Request?
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-center">
              Are you sure you want to delete and cancel your leave request for{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {requestToDelete?.type}
              </span>{" "}
              from <span className="font-bold text-slate-700 dark:text-slate-200">{requestToDelete?.startDate}</span> to{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">{requestToDelete?.endDate}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4">
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRequestToDelete(null)}
                className="rounded-xl font-bold text-xs uppercase tracking-wider h-11 w-full"
              >
                No, Keep It
              </Button>
              <Button
                type="button"
                onClick={handleDeleteConfirm}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider h-11 border-0 w-full"
              >
                Yes, Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT LEAVE DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">
              Modify Leave Request
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Update the details of your pending leave request. Approval is required after saving.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            {editErrorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{editErrorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <CustomSelect
                label="Leave Category"
                value={editType}
                onChange={(val) => setEditType(val as LeaveType)}
                options={selectOptions}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => {
                    setEditStartDate(e.target.value);
                    if (editHalfDay) {
                      setEditEndDate(e.target.value);
                    }
                  }}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  End Date
                </label>
                <Input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  required
                  disabled={editHalfDay}
                />
              </div>
            </div>

            {/* Show holiday overlap message if any */}
            {!editHalfDay && editStartDate && editEndDate && (() => {
              const excluded = getExcludedHolidays(editStartDate, editEndDate);
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
                id="editHalfDay"
                checked={editHalfDay}
                onChange={(e) => {
                  setEditHalfDay(e.target.checked);
                  if (e.target.checked && editStartDate) {
                    setEditEndDate(editStartDate);
                  }
                }}
                className="h-4 w-4 rounded border-slate-350 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
              <label
                htmlFor="editHalfDay"
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
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Describe your request..."
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
                  onClick={() => {
                    setEditOpen(false);
                    setEditRequest(null);
                  }}
                  className="rounded-xl font-bold text-xs uppercase tracking-wider h-11 w-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-primary rounded-xl font-bold text-xs uppercase tracking-wider h-11 border-0 w-full"
                >
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
