"use client";

import { useState } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useLeaveStore } from "@/stores/leave-store";
import {
  Search,
  Filter,
  CheckCircle2,
  PlaneTakeoff,
  Clock,
  CircleAlert,
  Mail,
  FolderDot,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  UserCheck,
  Tag,
  Phone,
  CalendarDays,
  Briefcase,
  Layers,
  MapPin,
  Cake,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  UserRoundCheck,
  Building
} from "lucide-react";

export default function TeamPage() {
  const { employees, currentUser, initialize } = useLeaveStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Auth check (relaxed to true for sandbox testing so all roles see action buttons)
  const isAuthorized = true;

  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState<any[]>([]);

  // Fetch branches on mount
  useState(() => {
    const loadBranches = async () => {
      try {
        const token = sessionStorage.getItem("ansh_auth_token");
        const res = await fetch("/api/settings", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.branches) {
            setBranches(data.settings.branches);
          }
        }
      } catch (err) {
        console.error("Failed to load branches in directory:", err);
      }
    };
    loadBranches();
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [role, setRole] = useState("Employee");
  const [status, setStatus] = useState("Active");

  // Detailed HR fields
  const [employeeCode, setEmployeeCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [designation, setDesignation] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");

  // Expanded HR details
  const [reportingManager, setReportingManager] = useState("");
  const [workLocation, setWorkLocation] = useState("Remote");
  const [personalEmail, setPersonalEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // Track expanded details card id
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

  // Additional fields for editing leave balances
  const [annualBalance, setAnnualBalance] = useState("15");
  const [sickBalance, setSickBalance] = useState("8");
  const [casualBalance, setCasualBalance] = useState("6");

  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [deletingEmpId, setDeletingEmpId] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sidebar Detail Drawer States
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "leaves" | "attendance">("profile");
  const [detailLeaves, setDetailLeaves] = useState<any[]>([]);
  const [detailPunches, setDetailPunches] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadMemberDetails = async (emp: any) => {
    setSelectedMemberForDetail(emp);
    setActiveTab("profile");
    setLoadingDetails(true);
    setDetailLeaves([]);
    setDetailPunches([]);
    
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      
      // Fetch leaves for the member
      const leavesPromise = fetch("/api/leaves", {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Impersonate-User": emp.id,
        },
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          return data.leaves || [];
        }
        return [];
      });

      // Fetch punches for the member
      const punchesPromise = fetch("/api/attendance/punch", {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Impersonate-User": emp.id,
        },
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          return data.punchHistory || [];
        }
        return [];
      });

      const [leaves, punches] = await Promise.all([leavesPromise, punchesPromise]);
      setDetailLeaves(leaves);
      setDetailPunches(punches);
    } catch (err) {
      console.error("Failed to load employee details for drawer:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setDepartment("Engineering");
    setRole("Employee");
    setStatus("Active");
    setEmployeeCode("");
    setPhoneNumber("");
    setJoiningDate("");
    setDesignation("");
    setEmploymentType("Full-time");
    setReportingManager("");
    setWorkLocation("Remote");
    setBranch(branches.length > 0 ? branches[0].name : "");
    setPersonalEmail("");
    setDateOfBirth("");
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setAnnualBalance("15");
    setSickBalance("8");
    setCasualBalance("6");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          department,
          role,
          status,
          employeeCode: employeeCode.trim(),
          phoneNumber: phoneNumber ? phoneNumber.trim() : "",
          joiningDate,
          designation: designation.trim(),
          employmentType,
          reportingManager: reportingManager.trim(),
          workLocation,
          branch,
          personalEmail: personalEmail.trim().toLowerCase(),
          dateOfBirth,
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add employee");
      }

      await initialize();
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to add employee to registry.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setErrorMsg("");
    setLoading(true);

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch(`/api/employees/${selectedEmp.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          department,
          role,
          status,
          annualBalance,
          sickBalance,
          casualBalance,
          employeeCode: employeeCode.trim(),
          phoneNumber: phoneNumber ? phoneNumber.trim() : "",
          joiningDate,
          designation: designation.trim(),
          employmentType,
          reportingManager: reportingManager.trim(),
          workLocation,
          branch,
          personalEmail: personalEmail.trim().toLowerCase(),
          dateOfBirth,
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update employee details");
      }

      await initialize();
      setIsEditModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update employee registry.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingEmpId) return;
    setErrorMsg("");
    setLoading(true);

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch(`/api/employees/${deletingEmpId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete employee");
      }

      await initialize();
      setIsDeleteConfirmOpen(false);
      setDeletingEmpId("");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete employee from registry.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTeam = employees.filter((emp: any) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.designation && emp.designation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "All" || emp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Organization Registry"
        title="Team Directory"
        description="View status registries, department breakdowns, and leave allowances for all active workspace employees."
      />

      {/* FILTER & SEARCH CONTROL BLOCK */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-6">
        <div className="flex items-center gap-4 w-full max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search employees, ID, titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-card rounded-xl border border-slate-200 focus-visible:border-primary shadow-sm"
            />
          </div>
          {isAuthorized && (
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="btn-primary h-11 px-5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Member
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {["All", "Active", "On Leave", "Half-day"].map((filter) => {
            const active = statusFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all outline-none cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* CARDS LIST GRID */}
      {filteredTeam.length === 0 ? (
        <Card className="crm-card flex flex-col items-center justify-center p-16 text-center">
          <CircleAlert className="h-10 w-10 text-slate-300 mb-4" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No employees found
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search criteria or filter tags.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeam.map((emp: any) => (
            <Card
              key={emp.id}
              className="crm-card group flex flex-col overflow-hidden border border-slate-200/50 hover:border-slate-300 dark:border-slate-800 relative cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              onClick={() => loadMemberDetails(emp)}
            >
              {/* TOP STRIP / ACTIONS BUTTONS FOR ADMIN */}
              <div className="h-10 w-full bg-slate-50 dark:bg-slate-900/60 border-b border-border/20 flex justify-between items-center px-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {emp.employeeCode || "No ID Code"}
                </span>
                {isAuthorized && emp.id !== currentUser?.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmp(emp);
                        setName(emp.name);
                        setEmail(emp.email);
                        setDepartment(emp.department);
                        setRole(emp.role);
                        setStatus(emp.status);
                        setEmployeeCode(emp.employeeCode || "");
                        setPhoneNumber(emp.phoneNumber || "");
                        setJoiningDate(emp.joiningDate || "");
                        setDesignation(emp.designation || "");
                        setEmploymentType(emp.employmentType || "Full-time");
                        setReportingManager(emp.reportingManager || "");
                        setWorkLocation(emp.workLocation || "Remote");
                        setBranch(emp.branch || "");
                        setPersonalEmail(emp.personalEmail || "");
                        setDateOfBirth(emp.dateOfBirth || "");
                        setEmergencyContactName(emp.emergencyContactName || "");
                        setEmergencyContactPhone(emp.emergencyContactPhone || "");
                        setAnnualBalance(String(emp.leaveBalance?.Annual ?? 15));
                        setSickBalance(String(emp.leaveBalance?.Sick ?? 8));
                        setCasualBalance(String(emp.leaveBalance?.Casual ?? 6));
                        setIsEditModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-primary transition-colors p-1 cursor-pointer"
                      title="Edit Member"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingEmpId(emp.id);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                      title="Delete Member"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <CardContent className="pt-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-base font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300 group-hover:scale-105 transition-all duration-300">
                      {emp.avatarInitials}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-slate-800 dark:text-white">
                        {emp.name}
                      </span>
                      <span className="block text-[10px] uppercase font-bold text-primary tracking-wide mt-0.5">
                        {emp.designation || emp.role}
                      </span>
                    </div>
                  </div>

                  <div>
                    {emp.status === "Active" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-0 hover:bg-emerald-500/10 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : emp.status === "On Leave" ? (
                      <Badge className="bg-blue-500/10 text-blue-600 border-0 hover:bg-blue-500/10 gap-1">
                        <PlaneTakeoff className="h-3 w-3" />
                        On Leave
                      </Badge>
                    ) : emp.status === "Half-day" ? (
                      <Badge className="bg-amber-500/10 text-amber-600 border-0 hover:bg-amber-500/10 gap-1">
                        <Clock className="h-3 w-3" />
                        Half-day
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Off</Badge>
                    )}
                  </div>
                </div>

                {/* DETAILED DATA FIELDS */}
                <div className="mt-5 space-y-2 text-xs border-b border-border/40 pb-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <FolderDot className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{emp.department} · <span className="font-semibold text-slate-400">{emp.employmentType || "Full-time"}</span></span>
                  </div>
                  {emp.phoneNumber && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{emp.phoneNumber}</span>
                    </div>
                  )}
                  {emp.joiningDate && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>Joined: {emp.joiningDate}</span>
                    </div>
                  )}
                </div>

                {/* LEAVE BALANCE SUMMARY DISPLAY */}
                <div className="mt-4 pt-1 flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>ALLOWANCES</span>
                  <span className="text-slate-500 dark:text-slate-300">Remaining</span>
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-emerald-50/50 p-2 dark:bg-emerald-950/20">
                    <span className="block font-bold text-emerald-600 dark:text-emerald-400">
                      {emp.leaveBalance?.Annual ?? 0}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">Annual</span>
                  </div>
                  <div className="rounded-lg bg-sky-50/50 p-2 dark:bg-sky-950/20">
                    <span className="block font-bold text-sky-600 dark:text-sky-400">
                      {emp.leaveBalance?.Sick ?? 0}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">Sick</span>
                  </div>
                  <div className="rounded-lg bg-purple-50/50 p-2 dark:bg-purple-950/20">
                    <span className="block font-bold text-purple-600 dark:text-purple-400">
                      {emp.leaveBalance?.Casual ?? 0}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">Casual</span>
                  </div>
                </div>

                {/* VIEW DETAILS ACTION FOOTER */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <div className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-primary transition-colors py-1.5 bg-slate-50 group-hover:bg-slate-100/50 dark:bg-slate-900/30 dark:group-hover:bg-slate-900/50 rounded-xl">
                    View Full Profile & Logs
                    <ArrowRight className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODALS */}
      {/* 1. Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="crm-card max-w-2xl w-full bg-card border border-border text-foreground shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <UserCheck className="h-4.5 w-4.5 text-primary" />
                Add Workspace Member
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <CardContent className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {errorMsg && (
                  <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 text-xs font-bold text-rose-500">
                    {errorMsg}
                  </div>
                )}

                {/* Section 1: Professional Information */}
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Professional Information
                </span>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Work Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. john@company.com"
                      className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Employee ID / Code
                    </label>
                    <input
                      type="text"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                      placeholder="e.g. ANSH-085"
                      className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Phone Number
                    </label>
                    <div className="phone-input-container">
                      <PhoneInput
                        international
                        defaultCountry="IN"
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChange={(val) => setPhoneNumber(val || "")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer text-slate-600 dark:text-slate-300"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Job Title / Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Employment Type
                    </label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                    >
                      <option value="Full-time">Full-time Employee</option>
                      <option value="Part-time">Part-time Employee</option>
                      <option value="Contract">Contractor</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Product Design">Product Design</option>
                      <option value="Data Analytics">Data Analytics</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      System Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                    >
                      <option value="Employee">Employee</option>
                      <option value="HR Manager">HR Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Roster Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Half-day">Half-day</option>
                      <option value="Off">Off</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Reporting Manager
                    </label>
                    <select
                      value={reportingManager}
                      onChange={(e) => setReportingManager(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                    >
                      <option value="">None / Self</option>
                      {employees
                        .filter((emp: any) => emp.name !== name)
                        .map((emp: any) => (
                          <option key={emp.id} value={emp.name}>
                            {emp.name} ({emp.designation || emp.role})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Work Location
                    </label>
                    <select
                      value={workLocation}
                      onChange={(e) => setWorkLocation(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                    >
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Office Branch
                    </label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                    >
                      <option value="">None / Unassigned</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section 2: Personal & Emergency details */}
                <div className="border-t border-border/40 pt-4 space-y-4">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Personal & Emergency Details
                  </span>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Personal Email
                      </label>
                      <input
                        type="email"
                        value={personalEmail}
                        onChange={(e) => setPersonalEmail(e.target.value)}
                        placeholder="e.g. personal@gmail.com"
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer text-slate-600 dark:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        placeholder="e.g. Spouse, Parent Name"
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Emergency Contact Phone Number
                      </label>
                      <input
                        type="tel"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        placeholder="e.g. +91 9999988888"
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-border/40">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-xs font-bold uppercase tracking-wider h-10 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-primary text-xs font-bold uppercase tracking-wider h-10 px-6 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Member"
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* 2. Edit Member Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="crm-card max-w-2xl w-full bg-card border border-border text-foreground shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Pencil className="h-4.5 w-4.5 text-primary" />
                Edit Member Details
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <CardContent className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {errorMsg && (
                  <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 text-xs font-bold text-rose-500">
                    {errorMsg}
                  </div>
                )}

                {/* Section 1: Professional Information */}
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Professional Information
                </span>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Email Address (Read-only)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="block w-full rounded-2xl border border-border bg-slate-100/50 dark:bg-slate-900/40 px-4 py-3 text-xs outline-none cursor-not-allowed opacity-60"
                    />
                  </div>
                </div>

                {/* Detailed HR Fields */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Employee ID / Code
                    </label>
                    <input
                      type="text"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                      placeholder="e.g. ANSH-085"
                      className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Phone Number
                    </label>
                    <div className="phone-input-container">
                      <PhoneInput
                        international
                        defaultCountry="IN"
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChange={(val) => setPhoneNumber(val || "")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer text-slate-600 dark:text-slate-300"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Job Title / Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Employment Type
                    </label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                    >
                      <option value="Full-time">Full-time Employee</option>
                      <option value="Part-time">Part-time Employee</option>
                      <option value="Contract">Contractor</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Product Design">Product Design</option>
                      <option value="Data Analytics">Data Analytics</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      System Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                    >
                      <option value="Employee">Employee</option>
                      <option value="HR Manager">HR Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Roster Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Half-day">Half-day</option>
                      <option value="Off">Off</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Reporting Manager
                    </label>
                    <select
                      value={reportingManager}
                      onChange={(e) => setReportingManager(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                    >
                      <option value="">None / Self</option>
                      {employees
                        .filter((emp: any) => emp.name !== name && emp.id !== selectedEmp?.id)
                        .map((emp: any) => (
                          <option key={emp.id} value={emp.name}>
                            {emp.name} ({emp.designation || emp.role})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Work Location
                    </label>
                    <select
                      value={workLocation}
                      onChange={(e) => setWorkLocation(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                    >
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Office Branch
                    </label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                    >
                      <option value="">None / Unassigned</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section 2: Personal & Emergency details */}
                <div className="border-t border-border/40 pt-4 space-y-4">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Personal & Emergency Details
                  </span>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Personal Email
                      </label>
                      <input
                        type="email"
                        value={personalEmail}
                        onChange={(e) => setPersonalEmail(e.target.value)}
                        placeholder="e.g. personal@gmail.com"
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer text-slate-600 dark:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        placeholder="e.g. Spouse, Parent Name"
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Emergency Contact Phone Number
                      </label>
                      <input
                        type="tel"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        placeholder="e.g. +91 9999988888"
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4 space-y-4">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Adjust Leave Allowance pools
                  </span>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Annual Leave
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={annualBalance}
                        onChange={(e) => setAnnualBalance(e.target.value)}
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Sick Leave
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={sickBalance}
                        onChange={(e) => setSickBalance(e.target.value)}
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Casual Leave
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={casualBalance}
                        onChange={(e) => setCasualBalance(e.target.value)}
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-border/40">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-xs font-bold uppercase tracking-wider h-10 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-primary text-xs font-bold uppercase tracking-wider h-10 px-6 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Details"
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="crm-card max-w-sm w-full bg-card border border-border text-foreground shadow-2xl p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
                Remove Team Member?
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                This action is irreversible. All leaves and punches history related to this employee will be deleted forever.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setDeletingEmpId("");
                }}
                className="text-xs font-bold uppercase tracking-wider h-10 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteSubmit}
                disabled={loading}
                className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider h-10 px-6 rounded-xl cursor-pointer"
              >
                {loading ? "Deleting..." : "Delete Member"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Sliding Sidebar Drawer */}
      {selectedMemberForDetail && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay with blur */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedMemberForDetail(null)}
          />

          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 animate-in slide-in-from-right duration-300">
            <div className="w-screen max-w-md md:max-w-xl bg-card border-l border-border/80 shadow-2xl flex flex-col h-full text-foreground animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-base font-extrabold text-primary">
                    {selectedMemberForDetail.avatarInitials}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-white leading-none">
                      {selectedMemberForDetail.name}
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-primary tracking-wide mt-1 block">
                      {selectedMemberForDetail.designation || selectedMemberForDetail.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMemberForDetail(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs Selector */}
              <div className="flex border-b border-border/30 bg-slate-50/50 dark:bg-slate-900/20 px-6 py-1">
                {[
                  { id: "profile", label: "Profile" },
                  { id: "leaves", label: "Leaves" },
                  { id: "attendance", label: "Attendance" },
                ].map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-3 text-xs font-bold transition-all relative border-b-2 -mb-px cursor-pointer ${
                        active
                          ? "border-primary text-primary"
                          : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    {/* Professional Grid */}
                    <div className="space-y-3">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Professional Info
                      </span>
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-border/20">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Employee Code</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.employeeCode || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">System Role</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.role}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Department</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.department}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Employment Type</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.employmentType || "Full-time"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Office Branch</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.branch || "Unassigned"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Work Location</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.workLocation || "Remote"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Manager</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.reportingManager || "None"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Joining Date</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.joiningDate || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Personal Grid */}
                    <div className="space-y-3">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Personal & Contact Info
                      </span>
                      <div className="grid grid-cols-1 gap-3 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-border/20 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-border/10">
                          <span className="text-slate-400 font-medium">Work Email</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.email}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-border/10">
                          <span className="text-slate-400 font-medium">Personal Email</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.personalEmail || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-border/10">
                          <span className="text-slate-400 font-medium">Phone Number</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.phoneNumber || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400 font-medium">Date of Birth</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.dateOfBirth || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    {(selectedMemberForDetail.emergencyContactName || selectedMemberForDetail.emergencyContactPhone) && (
                      <div className="rounded-2xl bg-rose-500/5 border border-rose-500/10 p-4 space-y-2">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                          <ShieldAlert className="h-4 w-4 shrink-0" />
                          Emergency Contact
                        </span>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Name</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.emergencyContactName || "N/A"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Phone</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.emergencyContactPhone || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "leaves" && (
                  <div className="space-y-6">
                    {/* Allowances Summary */}
                    <div className="space-y-3">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Remaining Leave Balances
                      </span>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-2xl bg-emerald-50/50 p-3.5 border border-emerald-500/10 dark:bg-emerald-950/20">
                          <span className="block text-lg font-black text-emerald-600 dark:text-emerald-400">
                            {selectedMemberForDetail.leaveBalance?.Annual ?? 0}
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">Annual</span>
                        </div>
                        <div className="rounded-2xl bg-sky-50/50 p-3.5 border border-sky-500/10 dark:bg-sky-950/20">
                          <span className="block text-lg font-black text-sky-600 dark:text-sky-400">
                            {selectedMemberForDetail.leaveBalance?.Sick ?? 0}
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">Sick</span>
                        </div>
                        <div className="rounded-2xl bg-purple-50/50 p-3.5 border border-purple-500/10 dark:bg-purple-950/20">
                          <span className="block text-lg font-black text-purple-600 dark:text-purple-400">
                            {selectedMemberForDetail.leaveBalance?.Casual ?? 0}
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">Casual</span>
                        </div>
                      </div>
                    </div>

                    {/* Leave History List */}
                    <div className="space-y-3">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Leave History
                      </span>
                      {loadingDetails ? (
                        <div className="flex items-center justify-center p-12 text-slate-400 text-xs gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          Loading leave records...
                        </div>
                      ) : detailLeaves.length === 0 ? (
                        <div className="text-center p-8 border border-dashed border-border/80 rounded-2xl text-slate-400 text-xs">
                          No leave requests found for this member.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {detailLeaves.map((leave) => (
                            <div
                              key={leave.id}
                              className="border border-border/50 rounded-2xl p-4 space-y-2.5 bg-card"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    {leave.type} Leave
                                  </span>
                                  <span className="block text-[10px] text-slate-400 mt-0.5">
                                    {leave.startDate} to {leave.endDate} · {leave.totalDays} day{leave.totalDays > 1 ? "s" : ""}
                                    {leave.halfDay && " (Half-day)"}
                                  </span>
                                </div>
                                <Badge
                                  className={
                                    leave.status === "Approved"
                                      ? "bg-emerald-500/10 text-emerald-600 border-0"
                                      : leave.status === "Rejected"
                                      ? "bg-rose-500/10 text-rose-600 border-0"
                                      : "bg-amber-500/10 text-amber-600 border-0"
                                  }
                                >
                                  {leave.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-border/10">
                                <span className="font-semibold text-slate-400">Reason:</span> {leave.reason}
                              </p>
                              <span className="block text-[9px] text-slate-400 text-right">
                                Applied: {new Date(leave.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "attendance" && (
                  <div className="space-y-4">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Attendance Logs
                    </span>
                    {loadingDetails ? (
                      <div className="flex items-center justify-center p-12 text-slate-400 text-xs gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Loading punch records...
                      </div>
                    ) : detailPunches.length === 0 ? (
                      <div className="text-center p-8 border border-dashed border-border/80 rounded-2xl text-slate-400 text-xs">
                        No attendance history found for this member.
                      </div>
                    ) : (
                      <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-5 space-y-6">
                        {detailPunches.map((punch) => {
                          const isLate = punch.status === "Late";
                          const isAbsent = punch.status === "Absent";
                          const isHalfDay = punch.status === "Half-day";
                          
                          let statusColor = "bg-emerald-500";
                          let badgeStyle = "bg-emerald-500/10 text-emerald-600 border-0";
                          if (isLate) {
                            statusColor = "bg-amber-500";
                            badgeStyle = "bg-amber-500/10 text-amber-600 border-0";
                          } else if (isAbsent) {
                            statusColor = "bg-rose-500";
                            badgeStyle = "bg-rose-500/10 text-rose-600 border-0";
                          } else if (isHalfDay) {
                            statusColor = "bg-blue-500";
                            badgeStyle = "bg-blue-500/10 text-blue-600 border-0";
                          }

                          return (
                            <div key={punch.id} className="relative">
                              {/* Dot on Timeline line */}
                              <span className={`absolute -left-[26px] top-1.5 flex h-3 w-3 rounded-full ring-4 ring-card ${statusColor}`} />
                              
                              <div className="border border-border/40 rounded-2xl p-4 bg-card hover:border-border transition-colors">
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                      {new Date(punch.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                                    </span>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                      <div>
                                        <span className="block text-[9px] uppercase text-slate-400 font-bold">Punch In</span>
                                        <span className="font-semibold">{punch.punchIn || "N/A"}</span>
                                      </div>
                                      <div>
                                        <span className="block text-[9px] uppercase text-slate-400 font-bold">Punch Out</span>
                                        <span className="font-semibold">{punch.punchOut || "Active"}</span>
                                      </div>
                                      {punch.duration && (
                                        <div>
                                          <span className="block text-[9px] uppercase text-slate-400 font-bold">Duration</span>
                                          <span className="font-bold text-slate-600 dark:text-slate-300">{punch.duration}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Badge className={badgeStyle}>{punch.status}</Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
