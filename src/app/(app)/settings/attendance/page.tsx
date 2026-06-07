"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLeaveStore } from "@/stores/leave-store";
import { FaceManageModal } from "@/components/attendance/FaceManageModal";
import {
  Loader2,
  Clock,
  ShieldAlert,
  CheckCircle,
  Shield,
  Sparkles,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  ChevronDown,
  Check,
  PlusCircle,
  Eye,
  X,
  Smile
} from "lucide-react";

interface CustomSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
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

  return (
    <div className="relative w-full" ref={selectRef}>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-full items-center justify-between rounded-xl border border-border bg-card dark:bg-slate-900 px-3.5 py-2 text-xs outline-none focus:border-primary/45 cursor-pointer select-none text-left transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOption?.icon && (
            <span className="text-slate-400 shrink-0">{selectedOption.icon}</span>
          )}
          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-250 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
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
                    {opt.icon && (
                      <span className={`shrink-0 ${isSelected ? "text-primary" : "text-slate-400"}`}>{opt.icon}</span>
                    )}
                    <div className="min-w-0">
                      <span className="block truncate font-semibold">{opt.label}</span>
                      {opt.description && (
                        <span className="block text-[9px] text-slate-400 font-normal mt-0.5 truncate leading-none">
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

interface ShiftActionsMenuProps {
  shift: any;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ShiftActionsMenu({ shift, onPreview, onEdit, onDelete }: ShiftActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative animate-in fade-in" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 rounded-xl border border-border bg-card/95 dark:bg-slate-900/95 shadow-xl backdrop-blur-md overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 p-1 space-y-0.5 select-none">
          <button
            type="button"
            onClick={() => {
              onPreview();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-slate-400" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5 text-slate-400" />
            <span>Edit</span>
          </button>
          <div className="h-px bg-border/40 my-0.5" />
          <button
            type="button"
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Time dropdown helper options
const timeOptions = [
  { value: "06:00 AM", label: "06:00 AM" },
  { value: "06:30 AM", label: "06:30 AM" },
  { value: "07:00 AM", label: "07:00 AM" },
  { value: "07:30 AM", label: "07:30 AM" },
  { value: "08:00 AM", label: "08:00 AM" },
  { value: "08:30 AM", label: "08:30 AM" },
  { value: "09:00 AM", label: "09:00 AM" },
  { value: "09:30 AM", label: "09:30 AM" },
  { value: "10:00 AM", label: "10:00 AM" },
  { value: "10:30 AM", label: "10:30 AM" },
  { value: "11:00 AM", label: "11:00 AM" },
  { value: "11:30 AM", label: "11:30 AM" },
  { value: "12:00 PM", label: "12:00 PM" },
  { value: "12:30 PM", label: "12:30 PM" },
  { value: "01:00 PM", label: "01:00 PM" },
  { value: "01:30 PM", label: "01:30 PM" },
  { value: "02:00 PM", label: "02:00 PM" },
  { value: "02:30 PM", label: "02:30 PM" },
  { value: "03:00 PM", label: "03:00 PM" },
  { value: "03:30 PM", label: "03:30 PM" },
  { value: "04:00 PM", label: "04:00 PM" },
  { value: "04:30 PM", label: "04:30 PM" },
  { value: "05:00 PM", label: "05:00 PM" },
  { value: "05:30 PM", label: "05:30 PM" },
  { value: "06:00 PM", label: "06:00 PM" },
  { value: "06:30 PM", label: "06:30 PM" },
  { value: "07:00 PM", label: "07:00 PM" },
  { value: "07:30 PM", label: "07:30 PM" },
  { value: "08:00 PM", label: "08:00 PM" },
  { value: "08:30 PM", label: "08:30 PM" },
  { value: "09:00 PM", label: "09:00 PM" },
  { value: "09:30 PM", label: "09:30 PM" },
  { value: "10:00 PM", label: "10:00 PM" },
  { value: "10:30 PM", label: "10:30 PM" },
  { value: "11:00 PM", label: "11:00 PM" },
  { value: "11:30 PM", label: "11:30 PM" },
  { value: "12:00 AM", label: "12:00 AM" },
  { value: "12:30 AM", label: "12:30 AM" },
  { value: "01:00 AM", label: "01:00 AM" },
  { value: "01:30 AM", label: "01:30 AM" },
  { value: "02:00 AM", label: "02:00 AM" },
  { value: "02:30 AM", label: "02:30 AM" },
  { value: "03:00 AM", label: "03:00 AM" },
  { value: "03:30 AM", label: "03:30 AM" },
  { value: "04:00 AM", label: "04:00 AM" },
  { value: "04:30 AM", label: "04:30 AM" },
  { value: "05:00 AM", label: "05:00 AM" },
  { value: "05:30 AM", label: "05:30 AM" }
];

const gracePeriodOptions = [
  { value: "5", label: "5 Minutes" },
  { value: "10", label: "10 Minutes" },
  { value: "15", label: "15 Minutes" },
  { value: "30", label: "30 Minutes" },
  { value: "45", label: "45 Minutes" },
  { value: "60", label: "60 Minutes" }
];

const workingHoursOptions = [
  { value: "4", label: "4 Hours (Half-day)" },
  { value: "5", label: "5 Hours" },
  { value: "6", label: "6 Hours" },
  { value: "7", label: "7 Hours" },
  { value: "8", label: "8 Hours" },
  { value: "9", label: "9 Hours" },
  { value: "10", label: "10 Hours" },
  { value: "12", label: "12 Hours" }
];

export default function AttendanceSettingPage() {
  const { currentUser, initialize, punchHistory, employees } = useLeaveStore();
  const isAuthorized = currentUser?.role === "HR Manager" || currentUser?.role === "Admin" || currentUser?.role === "Owner";

  // List states
  const [branches, setBranches] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);

  // Modals & form states
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [editShift, setEditShift] = useState<any | null>(null);
  const [shiftToDelete, setShiftToDelete] = useState<any | null>(null);
  const [previewShift, setPreviewShift] = useState<any | null>(null);
  const [drawerTab, setDrawerTab] = useState<"details" | "health">("details");
  const [healthFilter, setHealthFilter] = useState<string>("All Time");
  const [activeTab, setActiveTab] = useState<"roster" | "faces">("roster");
  const [selectedFaceEmployee, setSelectedFaceEmployee] = useState<any | null>(null);
  const [faceSearch, setFaceSearch] = useState("");

  // New Shift form fields
  const [newShiftName, setNewShiftName] = useState("");
  const [newShiftStartTime, setNewShiftStartTime] = useState("09:00 AM");
  const [newShiftEndTime, setNewShiftEndTime] = useState("06:00 PM");
  const [newShiftGracePeriod, setNewShiftGracePeriod] = useState("15");
  const [newShiftWorkingHours, setNewShiftWorkingHours] = useState("9");
  const [newShiftBranch, setNewShiftBranch] = useState("All");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = sessionStorage.getItem("ansh_auth_token");
        
        // Fetch branches from system settings
        const res = await fetch("/api/settings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.branches) {
            setBranches(data.settings.branches);
          }
        }

        // Fetch shift configurations from database
        const shiftRes = await fetch("/api/settings/shift", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (shiftRes.ok) {
          const shiftData = await shiftRes.json();
          setShifts(shiftData.shifts || []);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchSettings();
  }, []);



  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftName.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/settings/shift", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newShiftName.trim(),
          startTime: newShiftStartTime,
          endTime: newShiftEndTime,
          gracePeriod: parseInt(newShiftGracePeriod) || 15,
          workingHours: parseFloat(newShiftWorkingHours) || 9,
          branchId: newShiftBranch
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create shift");
      }

      const data = await res.json();
      if (data.shift) {
        setShifts([...shifts, data.shift]);
        setSuccessMsg(`Shift roster "${newShiftName.trim()}" created successfully!`);
        setIsAddShiftOpen(false);
        setTimeout(() => setSuccessMsg(""), 4000);
      }

      // Reset form fields
      setNewShiftName("");
      setNewShiftStartTime("09:00 AM");
      setNewShiftEndTime("06:00 PM");
      setNewShiftGracePeriod("15");
      setNewShiftWorkingHours("9");
      setNewShiftBranch("All");
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while adding custom shift.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editShift || !editShift.name.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/settings/shift", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editShift.id,
          name: editShift.name.trim(),
          startTime: editShift.startTime,
          endTime: editShift.endTime,
          gracePeriod: parseInt(editShift.gracePeriod) || 15,
          workingHours: parseFloat(editShift.workingHours) || 9,
          branchId: editShift.branchId
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update shift");
      }

      const data = await res.json();
      if (data.shift) {
        setShifts(shifts.map((s) => s.id === editShift.id ? data.shift : s));
        setSuccessMsg(`Shift roster "${editShift.name.trim()}" updated successfully!`);
        setEditShift(null);
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while editing custom shift.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch(`/api/settings/shift?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete shift");
      }

      setShifts(shifts.filter((s) => s.id !== id));
      setSuccessMsg("Shift roster deleted successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while deleting shift.");
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

  // Build branch list options for selectors
  const branchSelectorOptions = [
    { value: "All", label: "All Branches", description: "Applicable to all locations" },
    ...branches.map((b) => ({
      value: b.name,
      label: b.name,
      description: b.address
    }))
  ];

  // Helper: check if a date falls inside the selected range filter
  const isDateInRange = (dateStr: string, range: string) => {
    try {
      const punchDate = new Date(dateStr);
      punchDate.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      switch (range) {
        case "Today": {
          const todayStr = new Date().toISOString().split("T")[0];
          return dateStr === todayStr;
        }
        case "This Week": {
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
          const startOfWeek = new Date(now.setDate(diff));
          startOfWeek.setHours(0, 0, 0, 0);
          return punchDate >= startOfWeek;
        }
        case "This Month": {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return punchDate >= startOfMonth;
        }
        case "Last 3 Months": {
          const startOf3Months = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          return punchDate >= startOf3Months;
        }
        case "All Time":
        default:
          return true;
      }
    } catch (e) {
      return true;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Roster & Shift Settings"
        title="Attendance Setting"
        description="Configure shift timing pools, define rosters depending on office branches, and review attendance compliance metrics."
      />

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



      {/* TAB SWITCHER */}
      <div className="flex border-b border-border/40 gap-6 select-none pb-0.5">
        {[
          { id: "roster", label: "Shift Rosters" },
          { id: "faces", label: "Face Enrollment Profiles" }
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-xs font-bold uppercase tracking-wider relative transition-colors outline-none cursor-pointer ${
                active
                  ? "text-primary font-black"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "roster" ? (
        /* SHIFT ROSTER VIEW */
        <div className="space-y-6">
          <Card className="crm-card animate-in fade-in duration-300">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
              Shift Roster Manager
            </CardTitle>
            {isAuthorized && (
              <button
                onClick={() => setIsAddShiftOpen(true)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Shift
              </button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-400 mb-4">
              Define and schedule custom rosters, shift timing windows, and specific branch alignments to support multi-shift office structures.
            </p>

            {shifts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-border/50">
                No shifts defined for this workspace. Click the "Add Shift" button above to create one.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {shifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex flex-col justify-between p-5 rounded-2xl border border-border bg-card hover:shadow-md transition-all duration-300 relative group animate-in fade-in"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg bg-primary/10 text-primary border border-primary/20">
                          {shift.name}
                        </span>
                        {isAuthorized && (
                          <ShiftActionsMenu
                            shift={shift}
                            onPreview={() => {
                              setPreviewShift(shift);
                              setDrawerTab("details");
                              setHealthFilter("All Time");
                            }}
                            onEdit={() => setEditShift({ ...shift })}
                            onDelete={() => setShiftToDelete(shift)}
                          />
                        )}
                      </div>

                      <span className="block text-lg font-black text-slate-800 dark:text-white mt-1">
                        {shift.startTime} - {shift.endTime}
                      </span>

                      <div className="mt-4 pt-3 border-t border-border/20 flex flex-wrap gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                          Branch: {shift.branchId || "All"}
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                          Hours: {shift.workingHours} hrs
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                          Grace: {shift.gracePeriod} mins
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    ) : (
      /* EMPLOYEE FACIAL SIGN-IN MANAGER VIEW */
      <div className="space-y-6">
        <Card className="crm-card">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Smile className="h-4.5 w-4.5 text-primary" />
                Employee Face Profiles
              </CardTitle>
              <p className="text-[11px] text-slate-400">
                Manage employee facial enrollment profiles, update front/profile images, and clear biometric databases.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Search Bar */}
            <div className="max-w-md">
              <input
                type="text"
                value={faceSearch}
                onChange={(e) => setFaceSearch(e.target.value)}
                placeholder="Search employee name, department, designation..."
                className="block w-full rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-xs outline-none focus:border-primary/45"
              />
            </div>

            {/* Employees List Table */}
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Role & Department</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Enrolled Photos</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs">
                  {employees
                    .filter((emp) => {
                      const term = faceSearch.toLowerCase().trim();
                      if (!term) return true;
                      return (
                        emp.name.toLowerCase().includes(term) ||
                        (emp.department && emp.department.toLowerCase().includes(term)) ||
                        (emp.role && emp.role.toLowerCase().includes(term))
                      );
                    })
                    .map((emp) => {
                      const isEnrolled = emp.faceEnrolled;
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="px-5 py-4 flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-xs">
                              {emp.avatarInitials}
                            </div>
                            <div>
                              <span className="block font-bold text-slate-800 dark:text-white">{emp.name}</span>
                              <span className="block text-[10px] text-slate-400 mt-0.5">{emp.email}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="block font-semibold text-slate-700 dark:text-slate-350">{emp.role}</span>
                            <span className="block text-[10px] text-slate-450 mt-0.5">{emp.department}</span>
                          </td>
                          <td className="px-5 py-4">
                            {isEnrolled ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                Enrolled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-border/40">
                                Not Setup
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {isEnrolled && Array.isArray(emp.facePhotos) && emp.facePhotos.length === 3 ? (
                              <div className="flex gap-1.5">
                                {emp.facePhotos.map((url) => (
                                  <div key={url} className="h-7 w-9 rounded-lg border border-border overflow-hidden bg-slate-950 shadow-sm shrink-0">
                                    <img src={url} className="h-full w-full object-cover scale-x-[-1]" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Button
                              onClick={() => setSelectedFaceEmployee(emp)}
                              className="h-8 px-3 rounded-lg text-[10px] font-bold btn-primary"
                            >
                              Manage Face
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )}

    <FaceManageModal
      employee={selectedFaceEmployee}
      onClose={() => setSelectedFaceEmployee(null)}
      onUpdateComplete={async () => {
        await initialize();
      }}
      onDeleteComplete={async () => {
        await initialize();
      }}
    />

        {/* Add Shift Modal Dialog */}
        <Dialog open={isAddShiftOpen} onOpenChange={setIsAddShiftOpen}>
          <DialogContent className="max-w-md !overflow-visible select-none">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <PlusCircle className="h-4.5 w-4.5 text-primary" />
                Add Custom Shift
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 leading-relaxed mt-1">
                Define a new shift timing pool, required duration, and specific branch applicability.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddShift} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Shift Name / Designation
                </label>
                <input
                  type="text"
                  required
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  placeholder="e.g. Afternoon Roster"
                  className="block w-full rounded-xl border border-border bg-transparent px-3.5 py-2 text-xs outline-none focus:border-primary/45"
                />
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <CustomSelect
                  label="Start Time"
                  value={newShiftStartTime}
                  options={timeOptions}
                  onChange={setNewShiftStartTime}
                />

                <CustomSelect
                  label="End Time"
                  value={newShiftEndTime}
                  options={timeOptions}
                  onChange={setNewShiftEndTime}
                />
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <CustomSelect
                  label="Grace Period"
                  value={newShiftGracePeriod}
                  options={gracePeriodOptions}
                  onChange={setNewShiftGracePeriod}
                />

                <CustomSelect
                  label="Working Hours Requirement"
                  value={newShiftWorkingHours}
                  options={workingHoursOptions}
                  onChange={setNewShiftWorkingHours}
                />
              </div>

              <CustomSelect
                label="Branch Applicability"
                value={newShiftBranch}
                options={branchSelectorOptions}
                onChange={setNewShiftBranch}
              />

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddShiftOpen(false)}
                  className="w-full text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !newShiftName.trim()}
                  className="btn-primary w-full text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                >
                  {loading ? "Adding..." : "Add Shift"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Shift Modal Dialog */}
        <Dialog open={!!editShift} onOpenChange={(open) => !open && setEditShift(null)}>
          <DialogContent className="max-w-md !overflow-visible select-none">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Edit className="h-4.5 w-4.5 text-primary" />
                Edit Custom Shift
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 leading-relaxed mt-1">
                Modify timings, grace window, and branch alignment for this shift roster.
              </DialogDescription>
            </DialogHeader>

            {editShift && (
              <form onSubmit={handleEditShift} className="space-y-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Shift Name / Designation
                  </label>
                  <input
                    type="text"
                    required
                    value={editShift.name}
                    onChange={(e) => setEditShift({ ...editShift, name: e.target.value })}
                    placeholder="e.g. Afternoon Roster"
                    className="block w-full rounded-xl border border-border bg-transparent px-3.5 py-2 text-xs outline-none focus:border-primary/45"
                  />
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <CustomSelect
                    label="Start Time"
                    value={editShift.startTime}
                    options={timeOptions}
                    onChange={(val) => setEditShift({ ...editShift, startTime: val })}
                  />

                  <CustomSelect
                    label="End Time"
                    value={editShift.endTime}
                    options={timeOptions}
                    onChange={(val) => setEditShift({ ...editShift, endTime: val })}
                  />
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <CustomSelect
                    label="Grace Period"
                    value={String(editShift.gracePeriod)}
                    options={gracePeriodOptions}
                    onChange={(val) => setEditShift({ ...editShift, gracePeriod: parseInt(val) || 15 })}
                  />

                  <CustomSelect
                    label="Working Hours Requirement"
                    value={String(editShift.workingHours)}
                    options={workingHoursOptions}
                    onChange={(val) => setEditShift({ ...editShift, workingHours: parseFloat(val) || 9 })}
                  />
                </div>

                <CustomSelect
                  label="Branch Applicability"
                  value={editShift.branchId || "All"}
                  options={branchSelectorOptions}
                  onChange={(val) => setEditShift({ ...editShift, branchId: val })}
                />

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditShift(null)}
                    className="w-full text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !editShift.name.trim()}
                    className="btn-primary w-full text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Custom Shift Delete Confirmation Modal */}
        {shiftToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-rose-500/10 text-rose-500 ring-4 ring-rose-500/5">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                    Delete Shift Roster?
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Are you sure you want to remove the shift <strong className="text-foreground">"{shiftToDelete.name}"</strong>? This will delete the shift from this workspace and cannot be undone.
                  </p>
                </div>
                <div className="flex gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => setShiftToDelete(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-border text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteShift(shiftToDelete.id);
                      setShiftToDelete(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Roster Preview Slide-out Drawer */}
      {previewShift && (() => {
        // Calculate dynamic employee counts from store using branch details
        const rosterEmployees = previewShift.branchId === "All"
          ? employees
          : employees.filter((e) => e.branch === previewShift.branchId);
        const employeeCount = rosterEmployees.length;

        // Calculate dynamic health stats from store
        const employeeIds = rosterEmployees.map((e) => e.id);
        const rosterPunches = punchHistory.filter((p) => p.employeeId && employeeIds.includes(p.employeeId));
        
        // Apply date range filter
        const filteredPunches = rosterPunches.filter((p) => isDateInRange(p.date, healthFilter));
        const onTimeCount = filteredPunches.filter((p) => p.status === "On-time" || p.status === "WFH").length;
        const lateCount = filteredPunches.filter((p) => p.status === "Late").length;
        const totalPunches = filteredPunches.length;
        const onTimeRate = totalPunches > 0 ? Math.round((onTimeCount / totalPunches) * 100) : 100;

        return (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Click outside backdrop to close */}
            <div className="absolute inset-0" onClick={() => setPreviewShift(null)} />

            {/* Slide-out Panel */}
            <div className="relative h-full w-full max-w-md bg-card dark:bg-slate-950 border-l border-border p-6 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-10">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-border/40 pb-4 mb-5">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded bg-primary/10 text-primary border border-primary/20">
                    Branch: {previewShift.branchId === "All" ? "All Locations" : previewShift.branchId}
                  </span>
                  <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight mt-1">
                    {previewShift.name} Details
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewShift(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-border/40 gap-4 mb-5">
                {[
                  { id: "details", label: "Basic Details" },
                  { id: "health", label: "Roster Health" }
                ].map((tab) => {
                  const active = drawerTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDrawerTab(tab.id as any)}
                      className={`pb-3 text-[11px] font-extrabold uppercase tracking-wider relative transition-colors outline-none cursor-pointer ${
                        active
                          ? "text-primary font-black"
                          : "text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                      {active && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Drawer Tab Content */}
              <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1 scrollbar-none">
                {drawerTab === "details" ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-border/60 space-y-3.5">
                      <div className="flex justify-between items-center pb-2 border-b border-border/20">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Roster Name</span>
                        <span className="font-extrabold text-slate-800 dark:text-white">{previewShift.name}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-border/20">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Shift Hours</span>
                        <span className="font-extrabold text-slate-800 dark:text-white">{previewShift.startTime} - {previewShift.endTime}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-border/20">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Grace Period</span>
                        <span className="font-extrabold text-slate-800 dark:text-white">{previewShift.gracePeriod} minutes</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-border/20">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Working Hours Required</span>
                        <span className="font-extrabold text-slate-800 dark:text-white">{previewShift.workingHours} hours</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Office Branch Location</span>
                        <span className="font-extrabold text-slate-800 dark:text-white">{previewShift.branchId || "All"}</span>
                      </div>
                    </div>

                    {/* Assigned Employees Summary Card */}
                    <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Employees</span>
                        <h4 className="text-sm font-black text-slate-700 dark:text-slate-200">
                          {employeeCount === 0 ? "No active roster employees" : `${employeeCount} Workspace Employees`}
                        </h4>
                        <p className="text-[10px] text-slate-400">Count based on active location applicability</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center text-lg font-black shrink-0 shadow-sm border border-primary/25">
                        {employeeCount}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Period Selector Dropdown */}
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-border/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Roster History Period</span>
                      <select
                        value={healthFilter}
                        onChange={(e) => setHealthFilter(e.target.value)}
                        className="bg-card dark:bg-slate-950 border border-border rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:border-primary/45"
                      >
                        <option value="Today">Today</option>
                        <option value="This Week">This Week</option>
                        <option value="This Month">This Month</option>
                        <option value="Last 3 Months">Last 3 Months</option>
                        <option value="All Time">All Time</option>
                      </select>
                    </div>

                    {/* compliance radial/circle indicator */}
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-border/60 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="relative flex items-center justify-center">
                        <div className="h-24 w-24 rounded-full border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center ring-8 ring-primary/5">
                          <span className="text-xl font-black text-slate-800 dark:text-white">
                            {onTimeRate}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-850 dark:text-white text-xs">Punctuality Score</h4>
                        <p className="text-[10px] text-slate-400 leading-normal max-w-[240px]">
                          Percentage of logins that fall within the {previewShift.gracePeriod}-minute grace window for the selected range.
                        </p>
                      </div>
                    </div>

                    {/* Punch details */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-border/60 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-border/20">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Total Punch Records</span>
                        <span className="font-extrabold text-slate-800 dark:text-white">{totalPunches} punches</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-border/20">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">On-Time checkins</span>
                        <span className="font-extrabold text-emerald-500 dark:text-emerald-400">{onTimeCount} logs</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Late checkins</span>
                        <span className="font-extrabold text-rose-500">{lateCount} logs</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Close footer button */}
              <div className="border-t border-border/40 pt-4 mt-4">
                <Button
                  onClick={() => setPreviewShift(null)}
                  className="w-full text-xs font-bold uppercase tracking-wider h-10 rounded-xl cursor-pointer"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
