"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useLeaveStore, type PunchRecord } from "@/stores/leave-store";
import { sortByAppliedAtRecentFirst, sortPunchRecordsRecentFirst } from "@/lib/sort-recent-first";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SelfieVerifyDialog } from "@/components/attendance/SelfieVerifyDialog";
import { PunchLocationMapDialog } from "@/components/attendance/PunchLocationMapDialog";
import { CustomSelect, type CustomSelectOption } from "@/components/ui/custom-select";
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
  UserRoundCheck,
  Building,
  Check,
  MoreVertical,
  Copy,
  PlusCircle,
  Eye
} from "lucide-react";

const BLOOD_GROUP_OPTIONS: CustomSelectOption[] = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

const getLeaveColorClasses = (color?: string) => {
  switch (color) {
    case "purple":
      return { bg: "bg-purple-50/50 dark:bg-purple-950/20", text: "text-purple-600 dark:text-purple-400" };
    case "indigo":
      return { bg: "bg-indigo-50/50 dark:bg-indigo-950/20", text: "text-indigo-600 dark:text-indigo-400" };
    case "pink":
      return { bg: "bg-pink-50/50 dark:bg-pink-950/20", text: "text-pink-600 dark:text-pink-400" };
    case "slate":
      return { bg: "bg-slate-50/50 dark:bg-slate-950/20", text: "text-slate-650 dark:text-slate-450" };
    case "amber":
      return { bg: "bg-amber-50/50 dark:bg-amber-950/20", text: "text-amber-600 dark:text-amber-400" };
    case "emerald":
      return { bg: "bg-emerald-50/50 dark:bg-emerald-950/20", text: "text-emerald-600 dark:text-emerald-400" };
    case "sky":
      return { bg: "bg-sky-50/50 dark:bg-sky-950/20", text: "text-sky-600 dark:text-sky-400" };
    default:
      return { bg: "bg-slate-50/50 dark:bg-slate-950/20", text: "text-slate-650 dark:text-slate-450" };
  }
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

export default function TeamPage() {
  const { employees, currentUser, initialize, leaves } = useLeaveStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [scopeFilter, setScopeFilter] = useState<"All" | "My Team">("All");

  // Auth check (relaxed to true for sandbox testing so all roles see action buttons)
  const isAuthorized = true;

  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [customLeaveTypes, setCustomLeaveTypes] = useState<any[]>([]);

  // Fetch branch and shift dropdown values on mount
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const token = sessionStorage.getItem("ansh_auth_token");
        const [settingsRes, shiftRes, designationRes, catRes] = await Promise.all([
          fetch("/api/settings", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("/api/settings/shift", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("/api/settings/designation", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("/api/settings/leave-category", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.settings?.branches) {
            setBranches(data.settings.branches);
            if (!branch && data.settings.branches.length > 0) {
              setBranch(data.settings.branches[0].name);
            }
          }
        }
        if (shiftRes.ok) {
          const shiftData = await shiftRes.json();
          setShifts(shiftData.shifts || []);
        }
        if (designationRes.ok) {
          const designationData = await designationRes.json();
          const list = designationData.designations || [];
          setDesignations(list);
          if (!designation && list.length > 0) {
            setDesignation(list[0].name);
          }
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          setCustomLeaveTypes(catData.leaveCategories || []);
        }
      } catch (err) {
        console.error("Failed to load team dropdown data:", err);
      }
    };
    loadDropdowns();
  }, []);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDetailActionsOpen, setIsDetailActionsOpen] = useState(false);
  const [isAddOptionModalOpen, setIsAddOptionModalOpen] = useState(false);
  const [addOptionField, setAddOptionField] = useState<
    "designation" | "employmentType" | "department" | "role" | "status" | "workLocation" | "rosterShift" | "branch" | null
  >(null);

  // Wizard step state variables
  const [currentStep, setCurrentStep] = useState(1);
  const [editCurrentStep, setEditCurrentStep] = useState(1);

  // Validate step 1 fields
  const validateStep1 = (requirePassword = false) => {
    if (!name.trim()) return "Full Name is required.";
    if (!email.trim()) return "Work Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return "Please enter a valid work email address.";
    if (personalEmail.trim() && !emailRegex.test(personalEmail.trim())) {
      return "Please enter a valid personal email address.";
    }
    if (requirePassword) {
      if (!password) return "Login password is required.";
      if (password.length < 6) return "Password must be at least 6 characters.";
      if (password !== confirmPassword) return "Passwords do not match.";
    }
    return null;
  };

  const handleNextStep1 = () => {
    setErrorMsg("");
    const err = validateStep1(true);
    if (err) {
      setErrorMsg(err);
      return;
    }
    setCurrentStep(2);
  };

  const handleEditNextStep1 = () => {
    setErrorMsg("");
    const err = validateStep1();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setEditCurrentStep(2);
  };

  // Render horizontal stepper component
  const renderStepper = (step: number) => {
    const steps = [
      { num: 1, label: "Personal Info" },
      { num: 2, label: "Job Info" },
      { num: 3, label: "Emergency Info" }
    ];
    return (
      <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-border/40 flex items-center justify-between">
        {steps.map((s, idx) => {
          const isActive = step === s.num;
          const isCompleted = step > s.num;
          return (
            <div key={s.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 ring-2 ring-primary/20 ring-offset-2 dark:ring-offset-slate-900' 
                    : isCompleted 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400'
                }`}>
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    s.num
                  )}
                </div>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider transition-colors duration-300 ${
                  isActive ? 'text-primary' : isCompleted ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-400'
                }`}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="h-0.5 flex-1 mx-4 bg-slate-100 dark:bg-slate-800/80 relative">
                  <div className={`absolute inset-y-0 left-0 bg-primary transition-all duration-500 ${
                    isCompleted ? 'w-full' : 'w-0'
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [role, setRole] = useState("Employee");
  const [status, setStatus] = useState("Active");

  // Detailed HR fields
  const [employeeCode, setEmployeeCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [designation, setDesignation] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [employmentTypeItems, setEmploymentTypeItems] = useState<string[]>([
    "Full-time",
    "Part-time",
    "Contract",
    "Intern",
  ]);

  // Expanded HR details
  const [reportingManager, setReportingManager] = useState("");
  const [reportingHR, setReportingHR] = useState("");
  const [workLocation, setWorkLocation] = useState("Remote");
  const [workLocationItems, setWorkLocationItems] = useState<string[]>([
    "Remote",
    "On-site",
    "Hybrid",
    "Out of Office",
  ]);
  const [rosterShift, setRosterShift] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  // Track expanded details card id
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [deletingEmpId, setDeletingEmpId] = useState("");
  const [deleteConfirmEmailInput, setDeleteConfirmEmailInput] = useState("");
  const [deleteEmailCopied, setDeleteEmailCopied] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionLoading, setNewOptionLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sidebar Detail Drawer States
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "leaves" | "attendance">("profile");
  const [detailLeaves, setDetailLeaves] = useState<any[]>([]);
  const [detailPunches, setDetailPunches] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedPunchForMap, setSelectedPunchForMap] = useState<PunchRecord | null>(null);
  const [selectedSelfieAudit, setSelectedSelfieAudit] = useState<{
    punch: any;
    url: string;
    type: "Check-in" | "Check-out";
  } | null>(null);
  const [departmentItems, setDepartmentItems] = useState<string[]>([
    "Engineering",
    "Human Resources",
    "Product Design",
    "Data Analytics",
    "Executive",
  ]);
  const [roleItems, setRoleItems] = useState<string[]>([
    "Employee",
    "Manager",
    "HR Manager",
    "Admin",
    "Owner",
  ]);
  const [statusItems, setStatusItems] = useState<string[]>([
    "Active",
    "On Leave",
    "Half-day",
    "Off",
  ]);

  const loadMemberDetails = async (emp: any) => {
    setSelectedMemberForDetail(emp);
    setIsDetailActionsOpen(false);
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
      setDetailLeaves(sortByAppliedAtRecentFirst(leaves));
      setDetailPunches(sortPunchRecordsRecentFirst(punches));
    } catch (err) {
      console.error("Failed to load employee details for drawer:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDepartment("Engineering");
    setRole("Employee");
    setStatus("Active");
    setEmployeeCode("");
    setPhoneNumber("");
    setJoiningDate("");
    setDesignation(designations[0]?.name || "");
    
    setEmploymentType("Full-time");
    setReportingManager("");
    setReportingHR("");
    setWorkLocation("Remote");
    setRosterShift("");
    setBranch(branches.length > 0 ? branches[0].name : "");
    setPersonalEmail("");
    setDateOfBirth("");
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setBloodGroup("");
    setErrorMsg("");
    setSuccessMsg("");
    setCurrentStep(1);
    setEditCurrentStep(1);
  };

  const openEditMemberModal = (emp: any) => {
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
    if (emp.designation) {
      setDesignations((prev) => {
        const exists = prev.some((d: any) => d.name === emp.designation);
        if (exists) return prev;
        return [...prev, { id: `local-${emp.designation}`, name: emp.designation }].sort((a: any, b: any) =>
          a.name.localeCompare(b.name)
        );
      });
    }
    setEmploymentType(emp.employmentType || "Full-time");
    setReportingManager(emp.reportingManager || "");
    setReportingHR(emp.reportingHR || "");
    setWorkLocation(emp.workLocation || "Remote");
    setRosterShift(emp.rosterShift || "");
    setBranch(emp.branch || "");
    setPersonalEmail(emp.personalEmail || "");
    setDateOfBirth(emp.dateOfBirth || "");
    setEmergencyContactName(emp.emergencyContactName || "");
    setEmergencyContactPhone(emp.emergencyContactPhone || "");
    setBloodGroup(emp.bloodGroup || "");
    setEditCurrentStep(1);
    setIsEditModalOpen(true);
    setIsDetailActionsOpen(false);
  };

  const openDeleteMemberModal = (empId: string) => {
    setDeletingEmpId(empId);
    setDeleteConfirmEmailInput("");
    setDeleteEmailCopied(false);
    setIsDeleteConfirmOpen(true);
    setIsDetailActionsOpen(false);
  };

  const openAddOptionModal = (
    field: "designation" | "employmentType" | "department" | "role" | "status" | "workLocation" | "rosterShift" | "branch"
  ) => {
    setAddOptionField(field);
    setNewOptionName("");
    setIsAddOptionModalOpen(true);
  };

  const handleCreateOption = async () => {
    const nameToCreate = newOptionName.trim();
    if (!nameToCreate) return;

    try {
      setNewOptionLoading(true);
      setErrorMsg("");
      if (addOptionField === "designation") {
        const token = sessionStorage.getItem("ansh_auth_token");
        const res = await fetch("/api/settings/designation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: nameToCreate }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to create designation");
        }

        const created = data.designation;
        setDesignations((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setDesignation(created.name);
      } else if (addOptionField === "employmentType") {
        setEmploymentTypeItems((prev) => Array.from(new Set([...prev, nameToCreate])));
        setEmploymentType(nameToCreate);
      } else if (addOptionField === "department") {
        setDepartmentItems((prev) => Array.from(new Set([...prev, nameToCreate])));
        setDepartment(nameToCreate);
      } else if (addOptionField === "role") {
        setRoleItems((prev) => Array.from(new Set([...prev, nameToCreate])));
        setRole(nameToCreate);
      } else if (addOptionField === "status") {
        setStatusItems((prev) => Array.from(new Set([...prev, nameToCreate])));
        setStatus(nameToCreate);
      } else if (addOptionField === "workLocation") {
        setWorkLocationItems((prev) => Array.from(new Set([...prev, nameToCreate])));
        setWorkLocation(nameToCreate);
      } else if (addOptionField === "rosterShift") {
        setShifts((prev) => {
          const exists = prev.some((s: any) => s.name === nameToCreate);
          if (exists) return prev;
          return [...prev, { id: `custom-shift-${Date.now()}`, name: nameToCreate, startTime: "Custom", endTime: "Custom", branchId: "All" }];
        });
        setRosterShift(nameToCreate);
      } else if (addOptionField === "branch") {
        setBranches((prev) => {
          const exists = prev.some((b: any) => b.name === nameToCreate);
          if (exists) return prev;
          return [...prev, { id: `custom-branch-${Date.now()}`, name: nameToCreate, address: "Added from Team form" }];
        });
        setBranch(nameToCreate);
      }

      setIsAddOptionModalOpen(false);
      setNewOptionName("");
      setAddOptionField(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create option");
    } finally {
      setNewOptionLoading(false);
    }
  };

  const handleAddSubmit = async () => {
    if (currentStep !== 3) return;

    setErrorMsg("");
    const stepErr = validateStep1(true);
    if (stepErr) {
      setErrorMsg(stepErr);
      setCurrentStep(1);
      return;
    }
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
          password,
          department,
          role,
          status,
          employeeCode: employeeCode.trim(),
          phoneNumber: phoneNumber ? phoneNumber.trim() : "",
          joiningDate,
          designation: designation.trim(),
          employmentType,
          reportingManager: reportingManager.trim(),
          reportingHR: reportingHR.trim(),
          workLocation,
          branch,
          rosterShift,
          personalEmail: personalEmail.trim().toLowerCase(),
          dateOfBirth,
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
          bloodGroup: bloodGroup || null,
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

  const handleEditSubmit = async () => {
    if (editCurrentStep !== 3) return;

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
          employeeCode: employeeCode.trim(),
          phoneNumber: phoneNumber ? phoneNumber.trim() : "",
          joiningDate,
          designation: designation.trim(),
          employmentType,
          reportingManager: reportingManager.trim(),
          reportingHR: reportingHR.trim(),
          workLocation,
          branch,
          rosterShift,
          personalEmail: personalEmail.trim().toLowerCase(),
          dateOfBirth,
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
          bloodGroup: bloodGroup || null,
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
      setDeleteConfirmEmailInput("");
      setDeleteEmailCopied(false);
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

    const matchesScope =
      scopeFilter === "All" ||
      (emp.reportingManager && emp.reportingManager.toLowerCase() === currentUser?.name.toLowerCase()) ||
      (emp.reportingHR && emp.reportingHR.toLowerCase() === currentUser?.name.toLowerCase());

    return matchesSearch && matchesStatus && matchesScope;
  });

  const filteredShiftOptions = shifts.filter((s: any) => {
    if (!branch) return true;
    return s.branchId === "All" || s.branchId === branch;
  });

  const departmentOptions: CustomSelectOption[] = departmentItems.map((item) => ({ value: item, label: item }));
  const roleOptions: CustomSelectOption[] = roleItems.map((item) => ({ value: item, label: item }));
  const statusOptions: CustomSelectOption[] = statusItems.map((item) => ({ value: item, label: item }));
  const employmentTypeOptions: CustomSelectOption[] = employmentTypeItems.map((item) => ({
    value: item,
    label: item,
  }));
  const workLocationOptions: CustomSelectOption[] = workLocationItems.map((item) => ({
    value: item,
    label: item,
  }));
  const designationOptions: CustomSelectOption[] = designations.map((d: any) => ({
    value: d.name,
    label: d.name,
  }));
  const managerOptions: CustomSelectOption[] = employees
    .filter((emp: any) => emp.name !== name && emp.id !== selectedEmp?.id)
    .map((emp: any) => ({
      value: emp.name,
      label: emp.name,
      description: emp.designation || emp.role,
    }));
  const hrOptions: CustomSelectOption[] = employees
    .filter((emp: any) => (emp.role === "HR Manager" || emp.role === "Admin" || emp.role === "Owner") && emp.name !== name && emp.id !== selectedEmp?.id)
    .map((emp: any) => ({
      value: emp.name,
      label: emp.name,
      description: emp.designation || emp.role,
    }));
  const branchOptions: CustomSelectOption[] = branches.map((b) => ({
    value: b.name,
    label: b.name,
    description: b.address,
  }));
  const shiftOptions: CustomSelectOption[] = filteredShiftOptions.map((s: any) => ({
    value: s.name,
    label: s.name,
    description: `${s.startTime} - ${s.endTime}`,
  }));
  const deletingEmployee = employees.find((emp: any) => emp.id === deletingEmpId) || null;
  const isDeleteEmailMatched =
    !!deletingEmployee &&
    deleteConfirmEmailInput.trim().toLowerCase() === deletingEmployee.email.toLowerCase();

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
          {((currentUser?.role === "Admin" || currentUser?.role === "Owner" || currentUser?.role === "Manager" || currentUser?.role === "HR Manager")) && (
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Scope Filters: All vs My Team */}
          <div className="flex bg-slate-105 dark:bg-slate-800/80 rounded-xl p-1 gap-0.5 border border-slate-200/50 dark:border-slate-800/50">
            {(["All", "My Team"] as const).map((scope) => {
              const active = scopeFilter === scope;
              return (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setScopeFilter(scope)}
                  className={`rounded-lg px-4.5 py-1.5 text-xs font-extrabold transition-all outline-none cursor-pointer ${
                    active
                      ? "bg-white text-slate-800 shadow-sm dark:bg-slate-900 dark:text-white"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  {scope}
                </button>
              );
            })}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
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
                {((currentUser?.role === "Admin" ||
                  currentUser?.role === "Owner" ||
                  (emp.reportingManager && emp.reportingManager.toLowerCase() === currentUser?.name.toLowerCase()) ||
                  (emp.reportingHR && emp.reportingHR.toLowerCase() === currentUser?.name.toLowerCase())) && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditMemberModal(emp);
                      }}
                      className="text-slate-400 hover:text-primary transition-colors p-1 cursor-pointer"
                      title="Edit Member"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteMemberModal(emp.id);
                      }}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                      title="Delete Member"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
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
                  {emp.designation && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Briefcase className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{emp.designation}</span>
                    </div>
                  )}
                  {emp.branch && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{emp.branch}</span>
                    </div>
                  )}
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

                {customLeaveTypes.length === 0 ? (
                  <div className="mt-2 text-center text-[10px] text-slate-400 py-2 border border-dashed border-border/60 rounded-xl">
                    No leave types defined
                  </div>
                ) : (
                  <div className="mt-2.5 grid grid-cols-3 gap-2 text-center text-xs max-h-24 overflow-y-auto pr-0.5">
                    {customLeaveTypes
                      .filter((cat) => {
                        if (!cat.branchId || cat.branchId === "All") return true;
                        if (!emp.branch) return false;
                        return cat.branchId.toLowerCase() === emp.branch.toLowerCase();
                      })
                      .map((cat) => {
                        const approvedDaysTaken = leaves
                          .filter((r) => r.employeeId === emp.id && r.type === cat.name && r.status === "Approved")
                          .reduce((acc, curr) => acc + curr.totalDays, 0);
                        const balance = cat.days - approvedDaysTaken;
                        const colors = getLeaveColorClasses(cat.color);

                        return (
                          <div key={cat.id} className={`rounded-lg p-2 ${colors.bg}`}>
                            <span className={`block font-bold ${colors.text}`}>
                              {balance}
                            </span>
                            <span className="text-[9px] text-slate-450 dark:text-slate-400 uppercase tracking-wider block truncate" title={cat.name}>
                              {cat.name}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}

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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (currentStep === 3) {
                  void handleAddSubmit();
                }
              }}
            >
              {renderStepper(currentStep)}
              <CardContent className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {errorMsg && (
                  <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 text-xs font-bold text-rose-500 animate-in fade-in duration-200">
                    {errorMsg}
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Personal Information
                    </span>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                          Work Email Address *
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. john@company.com"
                          className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                          Login Password *
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          autoComplete="new-password"
                          className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                          Confirm Password *
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          autoComplete="new-password"
                          className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Share this password with the member so they can log in using their work email.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
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
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Job Details
                    </span>

                    <div className="grid gap-4 sm:grid-cols-2">
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
                      <CustomSelect
                        label="Job Title / Designation"
                        value={designation}
                        options={designationOptions}
                        onChange={setDesignation}
                        placeholder="Select designation"
                        allowAddNew
                        addNewLabel="Add New Designation"
                        onAddNew={() => openAddOptionModal("designation")}
                      />

                      <CustomSelect
                        label="Employment Type"
                        value={employmentType}
                        options={employmentTypeOptions}
                        onChange={setEmploymentType}
                        required
                        allowAddNew
                        addNewLabel="Add New Employment Type"
                        onAddNew={() => openAddOptionModal("employmentType")}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <CustomSelect
                        label="Department"
                        value={department}
                        options={departmentOptions}
                        onChange={setDepartment}
                        required
                        allowAddNew
                        addNewLabel="Add New Department"
                        onAddNew={() => openAddOptionModal("department")}
                      />

                      <CustomSelect
                        label="System Role"
                        value={role}
                        options={roleOptions}
                        onChange={setRole}
                        required
                      />

                      <CustomSelect
                        label="Roster Status"
                        value={status}
                        options={statusOptions}
                        onChange={setStatus}
                        required
                        allowAddNew
                        addNewLabel="Add New Roster Status"
                        onAddNew={() => openAddOptionModal("status")}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <CustomSelect
                        label="Reporting Manager"
                        value={reportingManager}
                        options={managerOptions}
                        onChange={setReportingManager}
                      />

                      <CustomSelect
                        label="Reporting HR"
                        value={reportingHR}
                        options={hrOptions}
                        onChange={setReportingHR}
                      />

                      <CustomSelect
                        label="Work Location"
                        value={workLocation}
                        options={workLocationOptions}
                        onChange={setWorkLocation}
                        required
                      />

                      <CustomSelect
                        label="Roster Shift"
                        value={rosterShift}
                        options={shiftOptions}
                        onChange={setRosterShift}
                        allowAddNew
                        addNewLabel="Add New Roster Shift"
                        onAddNew={() => openAddOptionModal("rosterShift")}
                      />

                      <CustomSelect
                        label="Office Branch"
                        value={branch}
                        options={branchOptions}
                        onChange={setBranch}
                        allowAddNew
                        addNewLabel="Add New Office Branch"
                        onAddNew={() => openAddOptionModal("branch")}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Emergency Information
                    </span>
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

                    <CustomSelect
                      label="Blood Group"
                      value={bloodGroup}
                      options={BLOOD_GROUP_OPTIONS}
                      onChange={setBloodGroup}
                      placeholder="Select blood group"
                    />
                  </div>
                )}

                <div className="pt-4 grid grid-cols-2 gap-3 border-t border-border/40">
                  {currentStep === 1 ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsAddModalOpen(false)}
                        className="w-full text-xs font-bold uppercase tracking-wider h-10 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleNextStep1}
                        className="btn-primary w-full text-xs font-bold uppercase tracking-wider h-10 cursor-pointer"
                      >
                        Next
                      </Button>
                    </>
                  ) : currentStep === 2 ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCurrentStep(1)}
                        className="w-full text-xs font-bold uppercase tracking-wider h-10 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="btn-primary w-full text-xs font-bold uppercase tracking-wider h-10 cursor-pointer"
                      >
                        Next
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={loading}
                        onClick={() => setCurrentStep(2)}
                        className="w-full text-xs font-bold uppercase tracking-wider h-10 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        disabled={loading}
                        onClick={() => void handleAddSubmit()}
                        className="btn-primary w-full text-xs font-bold uppercase tracking-wider h-10 cursor-pointer"
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
                    </>
                  )}
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editCurrentStep === 3) {
                  void handleEditSubmit();
                }
              }}
            >
              {renderStepper(editCurrentStep)}
              <CardContent className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {errorMsg && (
                  <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 text-xs font-bold text-rose-500 animate-in fade-in duration-200">
                    {errorMsg}
                  </div>
                )}

                {editCurrentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Personal Information
                    </span>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
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

                    <div className="grid gap-4 sm:grid-cols-2">
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
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>
                )}

                {editCurrentStep === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Job Details
                    </span>

                    <div className="grid gap-4 sm:grid-cols-2">
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
                      <CustomSelect
                        label="Job Title / Designation"
                        value={designation}
                        options={designationOptions}
                        onChange={setDesignation}
                        placeholder="Select designation"
                        allowAddNew
                        addNewLabel="Add New Designation"
                        onAddNew={() => openAddOptionModal("designation")}
                      />

                      <CustomSelect
                        label="Employment Type"
                        value={employmentType}
                        options={employmentTypeOptions}
                        onChange={setEmploymentType}
                        required
                        allowAddNew
                        addNewLabel="Add New Employment Type"
                        onAddNew={() => openAddOptionModal("employmentType")}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <CustomSelect
                        label="Department"
                        value={department}
                        options={departmentOptions}
                        onChange={setDepartment}
                        required
                        allowAddNew
                        addNewLabel="Add New Department"
                        onAddNew={() => openAddOptionModal("department")}
                      />

                      <CustomSelect
                        label="System Role"
                        value={role}
                        options={roleOptions}
                        onChange={setRole}
                        required
                      />

                      <CustomSelect
                        label="Roster Status"
                        value={status}
                        options={statusOptions}
                        onChange={setStatus}
                        required
                        allowAddNew
                        addNewLabel="Add New Roster Status"
                        onAddNew={() => openAddOptionModal("status")}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <CustomSelect
                        label="Reporting Manager"
                        value={reportingManager}
                        options={managerOptions}
                        onChange={setReportingManager}
                      />

                      <CustomSelect
                        label="Reporting HR"
                        value={reportingHR}
                        options={hrOptions}
                        onChange={setReportingHR}
                      />

                      <CustomSelect
                        label="Work Location"
                        value={workLocation}
                        options={workLocationOptions}
                        onChange={setWorkLocation}
                        required
                      />

                      <CustomSelect
                        label="Roster Shift"
                        value={rosterShift}
                        options={shiftOptions}
                        onChange={setRosterShift}
                        allowAddNew
                        addNewLabel="Add New Roster Shift"
                        onAddNew={() => openAddOptionModal("rosterShift")}
                      />

                      <CustomSelect
                        label="Office Branch"
                        value={branch}
                        options={branchOptions}
                        onChange={setBranch}
                        allowAddNew
                        addNewLabel="Add New Office Branch"
                        onAddNew={() => openAddOptionModal("branch")}
                      />
                    </div>
                  </div>
                )}

                {editCurrentStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Emergency Information
                    </span>
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

                    <CustomSelect
                      label="Blood Group"
                      value={bloodGroup}
                      options={BLOOD_GROUP_OPTIONS}
                      onChange={setBloodGroup}
                      placeholder="Select blood group"
                    />
                  </div>
                )}

                <div className="pt-4 grid grid-cols-2 gap-3 border-t border-border/40">
                  {editCurrentStep === 1 ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsEditModalOpen(false)}
                        className="w-full text-xs font-bold uppercase tracking-wider h-10 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleEditNextStep1}
                        className="btn-primary w-full text-xs font-bold uppercase tracking-wider h-10 cursor-pointer"
                      >
                        Next
                      </Button>
                    </>
                  ) : editCurrentStep === 2 ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setEditCurrentStep(1)}
                        className="w-full text-xs font-bold uppercase tracking-wider h-10 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setEditCurrentStep(3)}
                        className="btn-primary w-full text-xs font-bold uppercase tracking-wider h-10 cursor-pointer"
                      >
                        Next
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={loading}
                        onClick={() => setEditCurrentStep(2)}
                        className="w-full text-xs font-bold uppercase tracking-wider h-10 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        disabled={loading}
                        onClick={() => void handleEditSubmit()}
                        className="btn-primary w-full text-xs font-bold uppercase tracking-wider h-10 cursor-pointer"
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
                    </>
                  )}
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* Add Option Modal */}
      {isAddOptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="crm-card max-w-md w-full bg-card border border-border text-foreground shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <PlusCircle className="h-4.5 w-4.5 text-primary" />
                Add New {addOptionField === "employmentType"
                  ? "Employment Type"
                  : addOptionField === "department"
                  ? "Department"
                  : addOptionField === "role"
                  ? "System Role"
                  : addOptionField === "status"
                  ? "Roster Status"
                  : addOptionField === "workLocation"
                  ? "Work Location"
                  : addOptionField === "rosterShift"
                  ? "Roster Shift"
                  : addOptionField === "branch"
                  ? "Office Branch"
                  : "Designation"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOptionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  placeholder="Enter new option name"
                  className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddOptionModalOpen(false)}
                  className="w-full text-xs font-bold uppercase tracking-wider h-10 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateOption}
                  disabled={newOptionLoading || !newOptionName.trim()}
                  className="btn-primary w-full text-xs font-bold uppercase tracking-wider h-10 cursor-pointer"
                >
                  {newOptionLoading ? "Adding..." : "Add"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="crm-card max-w-md w-full bg-card border border-border text-foreground shadow-2xl p-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
                Remove Team Member?
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                This action is irreversible. All leaves and punches history related to this employee will be deleted forever.
              </p>
            </div>

            {deletingEmployee && (
              <div className="rounded-2xl border border-border/50 bg-slate-50/50 dark:bg-slate-900/30 p-3 space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Type email to confirm deletion
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-card border border-border/60 px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-200 truncate">
                    {deletingEmployee.email}
                  </code>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(deletingEmployee.email);
                      setDeleteEmailCopied(true);
                      setTimeout(() => setDeleteEmailCopied(false), 1400);
                    }}
                    className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/50 transition-colors cursor-pointer"
                    title="Copy email"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <input
                    type="text"
                    value={deleteConfirmEmailInput}
                    onChange={(e) => setDeleteConfirmEmailInput(e.target.value)}
                    placeholder="Paste email here to confirm"
                    className="block w-full rounded-xl border border-border bg-transparent px-3 py-2 text-xs outline-none focus:border-primary/45"
                  />
                  {deleteEmailCopied && (
                    <p className="text-[10px] text-emerald-500 mt-1 font-semibold">Email copied</p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setDeletingEmpId("");
                  setDeleteConfirmEmailInput("");
                  setDeleteEmailCopied(false);
                }}
                className="w-full text-xs font-bold uppercase tracking-wider h-10 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteSubmit}
                disabled={loading || !isDeleteEmailMatched}
                className="bg-rose-500 hover:bg-rose-600 disabled:bg-rose-400/50 text-white text-xs font-bold uppercase tracking-wider h-10 rounded-xl cursor-pointer"
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
            onClick={() => {
              setSelectedMemberForDetail(null);
              setIsDetailActionsOpen(false);
            }}
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
                <div className="relative flex items-center gap-1.5">
                  {((currentUser?.role === "Admin" ||
                    currentUser?.role === "Owner" ||
                    (selectedMemberForDetail.reportingManager && selectedMemberForDetail.reportingManager.toLowerCase() === currentUser?.name.toLowerCase()) ||
                    (selectedMemberForDetail.reportingHR && selectedMemberForDetail.reportingHR.toLowerCase() === currentUser?.name.toLowerCase())) &&
                    selectedMemberForDetail.id !== currentUser?.id) && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsDetailActionsOpen((prev) => !prev)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Member actions"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {isDetailActionsOpen && (
                        <div className="absolute right-10 top-0 z-50 w-36 rounded-xl border border-border bg-card shadow-xl p-1.5 space-y-1">
                          <button
                            type="button"
                            onClick={() => openEditMemberModal(selectedMemberForDetail)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteMemberModal(selectedMemberForDetail.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => {
                      setSelectedMemberForDetail(null);
                      setIsDetailActionsOpen(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
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
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Roster Shift</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.rosterShift || "Unassigned"}</span>
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
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Reporting HR</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedMemberForDetail.reportingHR || "None"}</span>
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
                    {(selectedMemberForDetail.emergencyContactName ||
                      selectedMemberForDetail.emergencyContactPhone ||
                      selectedMemberForDetail.bloodGroup) && (
                      <div className="rounded-2xl bg-rose-500/5 border border-rose-500/10 p-4 space-y-2">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                          <ShieldAlert className="h-4 w-4 shrink-0" />
                          Emergency Information
                        </span>
                        <div className="text-xs space-y-1">
                          {selectedMemberForDetail.bloodGroup && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Blood Group</span>
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                {selectedMemberForDetail.bloodGroup}
                              </span>
                            </div>
                          )}
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
                      {customLeaveTypes.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-400">
                          No leave types defined yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 text-center max-h-48 overflow-y-auto pr-1">
                          {customLeaveTypes
                            .filter((cat) => {
                              if (!cat.branchId || cat.branchId === "All") return true;
                              if (!selectedMemberForDetail?.branch) return false;
                              return cat.branchId.toLowerCase() === selectedMemberForDetail.branch.toLowerCase();
                            })
                            .map((cat) => {
                              const approvedDaysTaken = detailLeaves
                                .filter((r) => r.type === cat.name && r.status === "Approved")
                                .reduce((acc, curr) => acc + curr.totalDays, 0);
                              const balance = cat.days - approvedDaysTaken;
                              const borderClass = getBorderColorClass(cat.color);
                              const borderStyle = getBorderColorStyle(cat.color);

                              return (
                                <div
                                  key={cat.id}
                                  className={`rounded-2xl p-3 border-l-4 ${borderClass} border bg-slate-50/50 dark:bg-slate-950/20`}
                                  style={borderStyle}
                                >
                                  <span className="block text-lg font-black text-slate-800 dark:text-white leading-tight">
                                    {balance}
                                  </span>
                                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold block mt-0.5 truncate" title={cat.name}>
                                    {cat.name}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      )}
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
                                        <div className="flex items-center gap-1.5 font-semibold">
                                          <span>{punch.punchIn || "N/A"}</span>
                                          {punch.punchInPhoto && (
                                            <button
                                              onClick={() => setSelectedSelfieAudit({
                                                punch: punch,
                                                url: punch.punchInPhoto!,
                                                type: "Check-in"
                                              })}
                                              title="View & Verify Check-in Selfie"
                                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                            >
                                              <Eye className="h-3 w-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="block text-[9px] uppercase text-slate-400 font-bold">Punch Out</span>
                                        <div className="flex items-center gap-1.5 font-semibold">
                                          <span>{punch.punchOut || "Active"}</span>
                                          {punch.punchOutPhoto && (
                                            <button
                                              onClick={() => setSelectedSelfieAudit({
                                                punch: punch,
                                                url: punch.punchOutPhoto!,
                                                type: "Check-out"
                                              })}
                                              title="View & Verify Check-out Selfie"
                                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                            >
                                              <Eye className="h-3 w-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      {punch.duration && (
                                        <div>
                                          <span className="block text-[9px] uppercase text-slate-400 font-bold">Duration</span>
                                          <span className="font-bold text-slate-600 dark:text-slate-300">{punch.duration}</span>
                                        </div>
                                      )}
                                      {(punch.punchInLat != null || punch.punchOutLat != null) && (
                                        <div>
                                          <span className="block text-[9px] uppercase text-slate-400 font-bold">Location</span>
                                          <button
                                            onClick={() => setSelectedPunchForMap(punch)}
                                            className="inline-flex h-4.5 w-4.5 items-center justify-center rounded text-slate-450 hover:text-primary transition-colors cursor-pointer"
                                            title="View location map"
                                          >
                                            <MapPin className="h-3.5 w-3.5" />
                                          </button>
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
      <PunchLocationMapDialog
        punch={selectedPunchForMap}
        onClose={() => setSelectedPunchForMap(null)}
      />

      <SelfieVerifyDialog
        isOpen={selectedSelfieAudit !== null}
        onClose={() => setSelectedSelfieAudit(null)}
        selfieUrl={selectedSelfieAudit?.url || null}
        employeeId={selectedMemberForDetail?.id || "unknown"}
        employeeName={selectedMemberForDetail?.name || "Employee"}
        punchTime={selectedSelfieAudit?.type === "Check-in" ? selectedSelfieAudit.punch.punchIn : (selectedSelfieAudit?.punch.punchOut || "")}
        punchDate={selectedSelfieAudit?.punch.date || ""}
        type={selectedSelfieAudit?.type || "Check-in"}
      />
    </div>
  );
}
