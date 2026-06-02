"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLeaveStore } from "@/stores/leave-store";
import {
  Loader2,
  Calendar,
  ShieldAlert,
  CheckCircle,
  Sliders,
  Shield,
  Plus,
  Trash2,
  UploadCloud,
  Download,
  X,
  FileText,
  Check,
  Globe,
  PlusCircle,
  Clock,
  Sparkles,
  ChevronDown,
  User,
  Users,
  MoreVertical,
  Eye,
  Edit
} from "lucide-react";

import { CustomLeaveType, PolicyDocument, CompanyHoliday } from "@/lib/settings";

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
          {selectedOption?.colorPreview && (
            <div className={`h-2.5 w-2.5 rounded-full ${selectedOption.colorPreview} ring-2 ring-white dark:ring-slate-950 shrink-0`} />
          )}
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
                    {opt.colorPreview && (
                      <div className={`h-2.5 w-2.5 rounded-full ${opt.colorPreview} ring-2 ring-white dark:ring-slate-950 shrink-0 shadow-sm`} />
                    )}
                    {opt.icon && (
                      <span className={`shrink-0 ${isSelected ? "text-primary" : "text-slate-400"}`}>{opt.icon}</span>
                    )}
                    <div className="min-w-0">
                      <span className="block truncate">{opt.label}</span>
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

interface LeaveTypeActionsMenuProps {
  type: CustomLeaveType;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function LeaveTypeActionsMenu({ type, onPreview, onEdit, onDelete }: LeaveTypeActionsMenuProps) {
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
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-xl transition-all cursor-pointer ${
          isOpen 
            ? "bg-slate-150 dark:bg-slate-800 text-slate-800 dark:text-white" 
            : "text-slate-400 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
        title="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-32 rounded-xl border border-border dark:border-slate-700/80 bg-card/95 dark:bg-slate-950/95 shadow-2xl backdrop-blur-md overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 p-1 space-y-0.5 select-none ring-1 ring-black/5 dark:ring-white/5">
          <button
            type="button"
            onClick={() => {
              onPreview();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-slate-400 dark:text-slate-350" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5 text-slate-400 dark:text-slate-350" />
            <span>Edit</span>
          </button>
          <div className="h-px bg-border/40 dark:bg-slate-800/50 my-0.5" />
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

interface HolidayActionsMenuProps {
  holiday: CompanyHoliday;
  onEdit: () => void;
  onDelete: () => void;
}

function HolidayActionsMenu({ holiday, onEdit, onDelete }: HolidayActionsMenuProps) {
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
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-xl transition-all cursor-pointer ${
          isOpen 
            ? "bg-slate-150 dark:bg-slate-800 text-slate-800 dark:text-white" 
            : "text-slate-400 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
        title="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-32 rounded-xl border border-border dark:border-slate-700/80 bg-card/95 dark:bg-slate-950/95 shadow-2xl backdrop-blur-md overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 p-1 space-y-0.5 select-none ring-1 ring-black/5 dark:ring-white/5">
          <button
            type="button"
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5 text-slate-400 dark:text-slate-350" />
            <span>Edit</span>
          </button>
          <div className="h-px bg-border/40 dark:bg-slate-800/50 my-0.5" />
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

const colorOptions = [
  { value: "purple", label: "Purple Theme", colorPreview: "bg-purple-500" },
  { value: "indigo", label: "Indigo Theme", colorPreview: "bg-indigo-500" },
  { value: "pink", label: "Pink Theme", colorPreview: "bg-pink-500" },
  { value: "slate", label: "Slate Theme", colorPreview: "bg-slate-500" },
  { value: "amber", label: "Amber Theme", colorPreview: "bg-amber-500" },
  { value: "emerald", label: "Emerald Theme", colorPreview: "bg-emerald-500" },
  { value: "sky", label: "Sky Theme", colorPreview: "bg-sky-500" },
];

const genderOptions = [
  { value: "All", label: "All Employees", icon: <Users className="h-3.5 w-3.5" /> },
  { value: "Female", label: "Female Only", icon: <User className="h-3.5 w-3.5" /> },
  { value: "Male", label: "Male Only", icon: <User className="h-3.5 w-3.5" /> },
];

const accrualOptions = [
  { value: "One-time", label: "One-time Grant", description: "Full allowance granted upfront" },
  { value: "Monthly", label: "Monthly Accrual", description: "Earned proportionally each month" },
  { value: "Yearly", label: "Yearly Grant", description: "Granted at start of calendar year" },
];

const holidayTypeOptions = [
  { value: "Gazetted", label: "Gazetted Holiday", description: "Mandatory company-wide day off" },
  { value: "Restricted", label: "Restricted Holiday", description: "Optional time-off request" }
];

export default function LeaveSettingPage() {
  const { currentUser, initialize } = useLeaveStore();
  const isAuthorized = currentUser?.role === "HR Manager" || currentUser?.role === "Admin" || currentUser?.role === "Owner";

  const [activeTab, setActiveTab] = useState<"types" | "policies" | "holidays">("types");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewLeaveType, setPreviewLeaveType] = useState<CustomLeaveType | null>(null);
  const [editLeaveType, setEditLeaveType] = useState<CustomLeaveType | null>(null);
  const [leaveCategoryToDelete, setLeaveCategoryToDelete] = useState<CustomLeaveType | null>(null);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [isAddPolicyModalOpen, setIsAddPolicyModalOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<CompanyHoliday | null>(null);
  const [editHoliday, setEditHoliday] = useState<CompanyHoliday | null>(null);

  // Global standard limit state
  const [annualLimit, setAnnualLimit] = useState(15);
  const [sickLimit, setSickLimit] = useState(8);
  const [casualLimit, setCasualLimit] = useState(6);

  // Expanded HR items state
  const [customLeaveTypes, setCustomLeaveTypes] = useState<CustomLeaveType[]>([]);
  const [policyDocuments, setPolicyDocuments] = useState<PolicyDocument[]>([]);
  const [companyHolidays, setCompanyHolidays] = useState<CompanyHoliday[]>([]);

  // Form states - Leave Types
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDays, setNewTypeDays] = useState("10");
  const [newTypeColor, setNewTypeColor] = useState("purple");
  const [newTypeRollover, setNewTypeRollover] = useState(false);
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [newTypeGender, setNewTypeGender] = useState("All");
  const [newTypeAccrual, setNewTypeAccrual] = useState("One-time");
  const [newTypeRequiresProof, setNewTypeRequiresProof] = useState(false);

  // Form states - Policy Uploader
  const [uploadFileName, setUploadFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(-1);
  const [uploading, setUploading] = useState(false);
  const [editPolicy, setEditPolicy] = useState<PolicyDocument | null>(null);
  const [editPolicyName, setEditPolicyName] = useState("");

  // Form states - Holidays
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayType, setNewHolidayType] = useState("Gazetted");
  const [newHolidayBranch, setNewHolidayBranch] = useState("All");
  const [branches, setBranches] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = sessionStorage.getItem("ansh_auth_token");
        const res = await fetch("/api/settings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            if (data.settings.leaveSettings) {
              setAnnualLimit(data.settings.leaveSettings.annualLimit);
              setSickLimit(data.settings.leaveSettings.sickLimit);
              setCasualLimit(data.settings.leaveSettings.casualLimit);
              setPolicyDocuments(data.settings.leaveSettings.policyDocuments || []);
            }
            if (data.settings.branches) {
              setBranches(data.settings.branches);
            }
          }
        }

        // Fetch custom leave types from the database (filtered by workspace WID)
        const catRes = await fetch("/api/settings/leave-category", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (catRes.ok) {
          const catData = await catRes.json();
          setCustomLeaveTypes(catData.leaveCategories || []);
        }

        // Fetch company holidays from the database (filtered by workspace WID)
        const holRes = await fetch("/api/settings/holiday", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (holRes.ok) {
          const holData = await holRes.json();
          setCompanyHolidays(holData.holidays || []);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setFetching(false);
      }
    };
 
     fetchSettings();
   }, []);
 
   const handleSaveCustom = async (updatedSettings: any) => {
     setErrorMsg("");
     setSuccessMsg("");
     setLoading(true);
 
     try {
       const token = sessionStorage.getItem("ansh_auth_token");
       const res = await fetch("/api/settings", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({
           leaveSettings: {
             annualLimit,
             sickLimit,
             casualLimit,
             policyDocuments,
             companyHolidays,
             ...updatedSettings
           },
         }),
       });
 
       if (!res.ok) {
         throw new Error("Failed to save leave settings");
       }
 
       const data = await res.json();
       if (data.settings?.leaveSettings) {
         setPolicyDocuments(data.settings.leaveSettings.policyDocuments || []);
         setCompanyHolidays(data.settings.leaveSettings.companyHolidays || []);
       }
       setSuccessMsg("System leave settings updated successfully!");
       setTimeout(() => setSuccessMsg(""), 4000);
       await initialize();
     } catch (err) {
       console.error(err);
       setErrorMsg("An error occurred while saving leave settings.");
     } finally {
       setLoading(false);
     }
   };
 
 
   const handleAddLeaveType = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newTypeName.trim()) return;
 
     setLoading(true);
     setErrorMsg("");
     setSuccessMsg("");
 
     try {
       const token = sessionStorage.getItem("ansh_auth_token");
       const res = await fetch("/api/settings/leave-category", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({
           name: newTypeName.trim(),
           days: parseInt(newTypeDays) || 0,
           color: newTypeColor,
           allowRollover: newTypeRollover,
           description: newTypeDescription.trim() || undefined,
           applicableGender: newTypeGender,
           accrualPolicy: newTypeAccrual,
           requiresProof: newTypeRequiresProof
         }),
       });
 
       if (!res.ok) {
         throw new Error("Failed to create leave category");
       }
 
       const data = await res.json();
       if (data.leaveCategory) {
         setCustomLeaveTypes([...customLeaveTypes, data.leaveCategory]);
         setSuccessMsg("Custom leave category added successfully!");
         setIsAddModalOpen(false);
         setTimeout(() => setSuccessMsg(""), 4000);
       }
 
       setNewTypeName("");
       setNewTypeDays("10");
       setNewTypeColor("purple");
       setNewTypeRollover(false);
       setNewTypeDescription("");
       setNewTypeGender("All");
       setNewTypeAccrual("One-time");
       setNewTypeRequiresProof(false);
     } catch (err) {
       console.error(err);
       setErrorMsg("An error occurred while creating custom leave category.");
     } finally {
       setLoading(false);
     }
   };
 
    const handleEditLeaveType = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editLeaveType || !editLeaveType.name.trim()) return;
  
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
  
      try {
        const token = sessionStorage.getItem("ansh_auth_token");
        const res = await fetch("/api/settings/leave-category", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: editLeaveType.id,
            name: editLeaveType.name.trim(),
            days: editLeaveType.days,
            color: editLeaveType.color,
            allowRollover: editLeaveType.allowRollover,
            description: editLeaveType.description?.trim() || undefined,
            applicableGender: editLeaveType.applicableGender,
            accrualPolicy: editLeaveType.accrualPolicy,
            requiresProof: editLeaveType.requiresProof
          }),
        });
  
        if (!res.ok) {
          throw new Error("Failed to update leave category");
        }
  
        const data = await res.json();
        if (data.leaveCategory) {
          setCustomLeaveTypes(customLeaveTypes.map((t) => t.id === editLeaveType.id ? data.leaveCategory : t));
          setSuccessMsg("Custom leave category updated successfully!");
          setEditLeaveType(null);
          setTimeout(() => setSuccessMsg(""), 4000);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("An error occurred while updating custom leave category.");
      } finally {
        setLoading(false);
      }
    };
 
   const handleDeleteLeaveType = async (id: string) => {
     setErrorMsg("");
     setSuccessMsg("");
 
     try {
       const token = sessionStorage.getItem("ansh_auth_token");
       const res = await fetch(`/api/settings/leave-category?id=${id}`, {
         method: "DELETE",
         headers: {
           Authorization: `Bearer ${token}`,
         },
       });
 
       if (!res.ok) {
         throw new Error("Failed to delete leave category");
       }
 
       setCustomLeaveTypes(customLeaveTypes.filter((t) => t.id !== id));
       setSuccessMsg("Custom leave category deleted successfully!");
       setTimeout(() => setSuccessMsg(""), 4000);
     } catch (err) {
       console.error(err);
       setErrorMsg("An error occurred while deleting leave category.");
     }
   };

  const handleUploadPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim() || !selectedFile) return;
    
    setUploading(true);
    setUploadProgress(0);
    setErrorMsg("");
    setSuccessMsg("");

    const token = sessionStorage.getItem("ansh_auth_token");
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("documentName", uploadFileName.trim());

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/settings/policy", true);
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentage);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const resData = JSON.parse(xhr.responseText);
          if (resData.policyDocuments) {
            setPolicyDocuments(resData.policyDocuments);
            setSuccessMsg("Policy document uploaded successfully!");
            setIsAddPolicyModalOpen(false);
            setTimeout(() => setSuccessMsg(""), 4000);
          }
        } catch (err) {
          console.error("Parse upload response failed:", err);
          setErrorMsg("Upload succeeded but failed to parse response.");
        }
      } else {
        try {
          const resData = JSON.parse(xhr.responseText);
          setErrorMsg(resData.error || "Failed to upload document.");
        } catch {
          setErrorMsg("Failed to upload document.");
        }
      }
      setUploading(false);
      setUploadProgress(-1);
      setUploadFileName("");
      setSelectedFile(null);

      const fileInput = document.getElementById("policy-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    };

    xhr.onerror = () => {
      setErrorMsg("Network error during upload.");
      setUploading(false);
      setUploadProgress(-1);
    };

    xhr.send(formData);
  };

  const handleEditPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPolicy || !editPolicyName.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/settings/policy", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editPolicy.id,
          name: editPolicyName.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to rename policy document");
      }

      const resData = await res.json();
      if (resData.policyDocuments) {
        setPolicyDocuments(resData.policyDocuments);
        setSuccessMsg("Policy document renamed successfully!");
        setEditPolicy(null);
        setEditPolicyName("");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while renaming the policy document.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch(`/api/settings/policy?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete policy document");
      }

      const resData = await res.json();
      if (resData.policyDocuments) {
        setPolicyDocuments(resData.policyDocuments);
        setSuccessMsg("Policy document deleted successfully!");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while deleting policy document.");
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName.trim() || !newHolidayDate) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/settings/holiday", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newHolidayName.trim(),
          date: newHolidayDate,
          type: newHolidayType,
          branchId: newHolidayBranch
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create holiday");
      }

      const data = await res.json();
      if (data.holiday) {
        setCompanyHolidays([...companyHolidays, data.holiday].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ));
        setSuccessMsg("Company holiday scheduled successfully!");
        setIsHolidayModalOpen(false);
        setTimeout(() => setSuccessMsg(""), 4000);
      }

      setNewHolidayName("");
      setNewHolidayDate("");
      setNewHolidayType("Gazetted");
      setNewHolidayBranch("All");
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while creating company holiday.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editHoliday || !editHoliday.name.trim() || !editHoliday.date) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/settings/holiday", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editHoliday.id,
          name: editHoliday.name.trim(),
          date: editHoliday.date,
          type: editHoliday.type,
          branchId: editHoliday.branchId
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update holiday");
      }

      const data = await res.json();
      if (data.holiday) {
        setCompanyHolidays(companyHolidays.map((h) => h.id === editHoliday.id ? data.holiday : h).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ));
        setSuccessMsg("Company holiday updated successfully!");
        setEditHoliday(null);
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while updating holiday.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch(`/api/settings/holiday?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete holiday");
      }

      setCompanyHolidays(companyHolidays.filter((h) => h.id !== id));
      setSuccessMsg("Company holiday deleted successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while deleting holiday.");
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "purple":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
      case "indigo":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20";
      case "pink":
        return "bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20";
      case "slate":
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20";
      case "amber":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "emerald":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "sky":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20";
    }
  };

  if (fetching) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Loading leave policies...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Policy Settings"
        title="Leave Setting"
        description="Configure standard leave types, upload employee handbooks, manage calendar holidays, and adjust limits."
      />

      {/* Tabs Menu */}
      <div className="flex border-b border-border/40 pb-px gap-6 overflow-x-auto scrollbar-none">
        {[
          { id: "types", label: "Leave Types" },
          { id: "policies", label: "Policy Document Hub" },
          { id: "holidays", label: "Company Holidays" }
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSuccessMsg("");
                setErrorMsg("");
              }}
              className={`pb-4 text-xs font-bold uppercase tracking-wider relative transition-colors outline-none cursor-pointer ${
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


      {/* 2. LEAVE TYPES TAB */}
      {activeTab === "types" && (
        <div className="space-y-6">
          <Card className="crm-card">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
                Leave Types Manager
              </CardTitle>
              {isAuthorized && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Leave Type
                </button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-400 mb-4">
                Configure corporate leave categories, days allocation pools, gender restrictions, and documentation verification requirements.
              </p>

              {customLeaveTypes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-border/50">
                  No custom leave types defined. Click the "Add Leave Type" button above to create one.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in duration-300">
                  {customLeaveTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex flex-col justify-between p-5 rounded-2xl border border-border bg-card hover:shadow-md transition-all duration-300 relative group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg ${getColorClasses(type.color)}`}>
                            {type.name}
                          </span>
                          {isAuthorized && (
                            <LeaveTypeActionsMenu
                              type={type}
                              onPreview={() => setPreviewLeaveType(type)}
                              onEdit={() => setEditLeaveType({ ...type })}
                              onDelete={() => handleDeleteLeaveType(type.id)}
                            />
                          )}
                        </div>
                        
                        <span className="block text-xl font-black text-slate-800 dark:text-white mt-1">
                          {type.days} Days
                        </span>

                        {type.description && (
                          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed italic">
                            "{type.description}"
                          </p>
                        )}

                        {/* Policy details tags */}
                        <div className="mt-4 pt-3 border-t border-border/20 flex flex-wrap gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                            Eligible: {type.applicableGender || "All"}
                          </span>
                          <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                            Accrual: {type.accrualPolicy || "One-time"}
                          </span>
                          <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                            Rollover: {type.allowRollover ? "Yes" : "No"}
                          </span>
                          {type.requiresProof && (
                            <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-md">
                              Proof Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Leave Category Modal Dialog */}
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogContent className="max-w-md !overflow-visible select-none">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <PlusCircle className="h-4.5 w-4.5 text-primary" />
                  Add Leave Category
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 leading-relaxed mt-1">
                  Define a new custom leave category, set the days allowance, eligibility restrictions, and verification rules.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddLeaveType} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Leave Type Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="e.g. Study Leave"
                    className="block w-full rounded-xl border border-border bg-transparent px-3.5 py-2 text-xs outline-none focus:border-primary/45"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Description / Guidelines
                  </label>
                  <textarea
                    value={newTypeDescription}
                    onChange={(e) => setNewTypeDescription(e.target.value)}
                    placeholder="Explain when employees can request this leave..."
                    rows={2}
                    className="block w-full rounded-xl border border-border bg-transparent px-3.5 py-2 text-xs outline-none focus:border-primary/45 resize-none"
                  />
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Days Allowance
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      required
                      value={newTypeDays}
                      onChange={(e) => setNewTypeDays(e.target.value)}
                      className="block w-full rounded-xl border border-border bg-transparent px-3.5 py-2 text-xs outline-none focus:border-primary/45"
                    />
                  </div>

                  <CustomSelect
                    label="Color Theme"
                    value={newTypeColor}
                    options={colorOptions}
                    onChange={setNewTypeColor}
                  />
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <CustomSelect
                    label="Gender Eligibility"
                    value={newTypeGender}
                    options={genderOptions}
                    onChange={setNewTypeGender}
                  />

                  <CustomSelect
                    label="Accrual Strategy"
                    value={newTypeAccrual}
                    options={accrualOptions}
                    onChange={setNewTypeAccrual}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 py-0.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rollover"
                      checked={newTypeRollover}
                      onChange={(e) => setNewTypeRollover(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="rollover" className="text-[11px] font-semibold text-slate-650 dark:text-slate-400 cursor-pointer leading-tight">
                      Allow Carry-forward
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="requiresProof"
                      checked={newTypeRequiresProof}
                      onChange={(e) => setNewTypeRequiresProof(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="requiresProof" className="text-[11px] font-semibold text-slate-650 dark:text-slate-400 cursor-pointer leading-tight">
                      Requires Proof Doc
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="w-full text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !newTypeName.trim()}
                    className="btn-primary w-full text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                  >
                    {loading ? "Adding..." : "Add Leave Type"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Preview Leave Category Dialog */}
          <Dialog open={!!previewLeaveType} onOpenChange={(open) => !open && setPreviewLeaveType(null)}>
            <DialogContent className="max-w-md !overflow-visible select-none">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Eye className="h-4.5 w-4.5 text-primary" />
                  Leave Category Details
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 leading-relaxed mt-1">
                  Full configuration and eligibility settings for this leave type.
                </DialogDescription>
              </DialogHeader>

              {previewLeaveType && (
                <div className="space-y-4 pt-3 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Leave Type Name
                    </span>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border font-semibold text-slate-700 dark:text-slate-200">
                      {previewLeaveType.name}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Description / Guidelines
                    </span>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border text-slate-600 dark:text-slate-350 whitespace-pre-wrap leading-relaxed">
                      {previewLeaveType.description || "No description provided."}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Days Allowance
                      </span>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border font-bold text-slate-700 dark:text-slate-200">
                        {previewLeaveType.days} Days
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Color Theme
                      </span>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border flex items-center gap-2 font-semibold capitalize text-slate-700 dark:text-slate-200">
                        <div className={`h-3 w-3 rounded-full ${colorOptions.find(o => o.value === previewLeaveType.color)?.colorPreview || "bg-slate-400"}`} />
                        {previewLeaveType.color}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Gender Eligibility
                      </span>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border font-semibold text-slate-700 dark:text-slate-200">
                        {previewLeaveType.applicableGender || "All"}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Accrual Strategy
                      </span>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border font-semibold text-slate-700 dark:text-slate-200">
                        {previewLeaveType.accrualPolicy || "One-time"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border/60">
                      <div className={`h-2 w-2 rounded-full ${previewLeaveType.allowRollover ? "bg-emerald-500" : "bg-slate-350"}`} />
                      <span className="font-semibold text-slate-650 dark:text-slate-400">
                        Carry-forward: {previewLeaveType.allowRollover ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border/60">
                      <div className={`h-2 w-2 rounded-full ${previewLeaveType.requiresProof ? "bg-rose-500" : "bg-slate-350"}`} />
                      <span className="font-semibold text-slate-650 dark:text-slate-400">
                        Requires Proof: {previewLeaveType.requiresProof ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={() => setPreviewLeaveType(null)}
                      className="w-full text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                    >
                      Close Details
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Leave Category Modal Dialog */}
          <Dialog open={!!editLeaveType} onOpenChange={(open) => !open && setEditLeaveType(null)}>
            <DialogContent className="max-w-md !overflow-visible select-none">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Edit className="h-4.5 w-4.5 text-primary" />
                  Edit Leave Category
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 leading-relaxed mt-1">
                  Modify parameters, days allowance, eligibility restrictions, and verification rules.
                </DialogDescription>
              </DialogHeader>

              {editLeaveType && (
                <form onSubmit={handleEditLeaveType} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Leave Type Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editLeaveType.name}
                      onChange={(e) => setEditLeaveType({ ...editLeaveType, name: e.target.value })}
                      placeholder="e.g. Study Leave"
                      className="block w-full rounded-xl border border-border bg-transparent px-3.5 py-2 text-xs outline-none focus:border-primary/45"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Description / Guidelines
                    </label>
                    <textarea
                      value={editLeaveType.description || ""}
                      onChange={(e) => setEditLeaveType({ ...editLeaveType, description: e.target.value })}
                      placeholder="Explain when employees can request this leave..."
                      rows={2}
                      className="block w-full rounded-xl border border-border bg-transparent px-3.5 py-2 text-xs outline-none focus:border-primary/45 resize-none"
                    />
                  </div>

                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Days Allowance
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        required
                        value={editLeaveType.days}
                        onChange={(e) => setEditLeaveType({ ...editLeaveType, days: parseInt(e.target.value) || 0 })}
                        className="block w-full rounded-xl border border-border bg-transparent px-3.5 py-2 text-xs outline-none focus:border-primary/45"
                      />
                    </div>

                    <CustomSelect
                      label="Color Theme"
                      value={editLeaveType.color}
                      options={colorOptions}
                      onChange={(val) => setEditLeaveType({ ...editLeaveType, color: val })}
                    />
                  </div>

                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <CustomSelect
                      label="Gender Eligibility"
                      value={editLeaveType.applicableGender || "All"}
                      options={genderOptions}
                      onChange={(val) => setEditLeaveType({ ...editLeaveType, applicableGender: val })}
                    />

                    <CustomSelect
                      label="Accrual Strategy"
                      value={editLeaveType.accrualPolicy || "One-time"}
                      options={accrualOptions}
                      onChange={(val) => setEditLeaveType({ ...editLeaveType, accrualPolicy: val })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-0.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="edit-rollover"
                        checked={editLeaveType.allowRollover}
                        onChange={(e) => setEditLeaveType({ ...editLeaveType, allowRollover: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                      />
                      <label htmlFor="edit-rollover" className="text-[11px] font-semibold text-slate-650 dark:text-slate-400 cursor-pointer leading-tight">
                        Allow Carry-forward
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="edit-requiresProof"
                        checked={editLeaveType.requiresProof}
                        onChange={(e) => setEditLeaveType({ ...editLeaveType, requiresProof: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                      />
                      <label htmlFor="edit-requiresProof" className="text-[11px] font-semibold text-slate-650 dark:text-slate-400 cursor-pointer leading-tight">
                        Requires Proof Doc
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditLeaveType(null)}
                      className="w-full text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !editLeaveType.name.trim()}
                      className="btn-primary w-full text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Custom Delete Confirmation Modal */}
          {leaveCategoryToDelete && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-background border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-3 rounded-full bg-rose-500/10 text-rose-500 ring-4 ring-rose-500/5">
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                      Delete Leave Category?
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Are you sure you want to remove the <strong className="text-foreground">"{leaveCategoryToDelete.name}"</strong> category? This action will delete the category definition and cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-3 w-full pt-2">
                    <button
                      type="button"
                      onClick={() => setLeaveCategoryToDelete(null)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-border text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteLeaveType(leaveCategoryToDelete.id);
                        setLeaveCategoryToDelete(null);
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
        </div>
      )}

      {/* 3. POLICY DOCUMENT HUB TAB */}
      {activeTab === "policies" && (
        <div className="space-y-6">
          <Card className="crm-card">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" />
                Leave Policies & Employee Handbooks
              </CardTitle>
              {isAuthorized && (
                <button
                  type="button"
                  onClick={() => {
                    setUploadFileName("");
                    setSelectedFile(null);
                    setIsAddPolicyModalOpen(true);
                  }}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Policy
                </button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-400">
                Below are the official company policy handbooks. Employees can download these files to understand terms, medical allowances, and guidelines.
              </p>

              <div className="space-y-3.5">
                {policyDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                          {doc.name}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          Uploaded on {doc.uploadedAt} · {doc.size}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (doc.s3Key) {
                            const token = sessionStorage.getItem("ansh_auth_token") || "";
                            window.open(`/api/settings/download-policy?id=${doc.id}&token=${encodeURIComponent(token)}`, "_blank");
                          } else {
                            alert(`Simulating download for: ${doc.name}`);
                          }
                        }}
                        className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                        title="Download PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      {isAuthorized && (
                        <>
                          <button
                            onClick={() => {
                              setEditPolicy(doc);
                              const nameWithoutExt = doc.name.substring(0, doc.name.lastIndexOf('.')) || doc.name;
                              setEditPolicyName(nameWithoutExt);
                            }}
                            className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                            title="Edit / Rename Policy"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePolicy(doc.id)}
                            className="h-8 w-8 rounded-lg bg-rose-50/10 hover:bg-rose-50/20 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete Document"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Policy Modal */}
      {editPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <Card className="crm-card max-w-sm w-full bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Edit className="h-4.5 w-4.5 text-primary" />
                Rename Policy Handbook
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditPolicy(null);
                  setEditPolicyName("");
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditPolicy} className="flex flex-col min-h-0 flex-1">
              <CardContent className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Document Name
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={editPolicyName}
                    onChange={(e) => setEditPolicyName(e.target.value)}
                    placeholder="Enter new document name"
                    className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45 disabled:opacity-60"
                  />
                </div>
              </CardContent>

              <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditPolicy(null);
                    setEditPolicyName("");
                  }}
                  className="text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !editPolicyName.trim()}
                  className="btn-primary text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                >
                  {loading ? "Renaming..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Policy Modal */}
      {isAddPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <Card className="crm-card max-w-md w-full bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <UploadCloud className="h-4.5 w-4.5 text-primary" />
                Upload Policy Handbook
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPolicyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadPolicy} className="flex flex-col min-h-0 flex-1">
              <CardContent className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                {!isAuthorized ? (
                  <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-xs font-bold text-amber-500 flex items-start gap-2">
                    <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>Only HR managers can upload new policy guideline documents.</span>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Document Name
                      </label>
                      <input
                        type="text"
                        required
                        disabled={uploading}
                        value={uploadFileName}
                        onChange={(e) => setUploadFileName(e.target.value)}
                        placeholder="e.g. Parental_Leave_Guidelines_2026"
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45 disabled:opacity-60 mb-4"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Select Document File
                      </label>
                      <input
                        id="policy-file-input"
                        type="file"
                        required
                        disabled={uploading}
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSelectedFile(file);
                          if (file && !uploadFileName) {
                            const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                            setUploadFileName(nameWithoutExt);
                          }
                        }}
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45 disabled:opacity-60 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:transition-all file:cursor-pointer"
                      />
                    </div>

                    {uploading && (
                      <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                          <span>Uploading File...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>

              {isAuthorized && (
                <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddPolicyModalOpen(false)}
                    className="text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploading || !uploadFileName.trim() || !selectedFile}
                    className="btn-primary text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4" />
                        Upload Policy PDF
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </Card>
        </div>
      )}

      {/* 4. COMPANY HOLIDAYS TAB */}
      {activeTab === "holidays" && (
        <div className="space-y-6">
          <Card className="crm-card">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-primary" />
                Official Holiday Schedule (2026)
              </CardTitle>
              {isAuthorized && (
                <button
                  onClick={() => setIsHolidayModalOpen(true)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Holiday
                </button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-400 mb-2">
                Listed below are the official company-wide holidays. These days are registered on the main Leave calendar as non-working days.
              </p>

              {companyHolidays.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-border/50">
                  No holidays scheduled. Click "Add Holiday" above to schedule one.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in duration-300">
                  {companyHolidays.map((hol) => (
                    <div
                      key={hol.id}
                      className="flex flex-col justify-between p-5 rounded-2xl border border-border bg-card hover:shadow-md transition-all duration-300 relative group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-extrabold text-[10px]">
                            {new Date(hol.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                          {isAuthorized && (
                            <HolidayActionsMenu
                              holiday={hol}
                              onEdit={() => setEditHoliday({ ...hol })}
                              onDelete={() => setHolidayToDelete(hol)}
                            />
                          )}
                        </div>
                        
                        <span className="block text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                          {hol.name}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">
                          {new Date(hol.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric" })}
                        </span>

                        <div className="mt-4 pt-3 border-t border-border/20 flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-wider">
                          {hol.branchId && hol.branchId !== "All" ? (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/10">
                              {hol.branchId}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                              All Branches
                            </span>
                          )}
                          {hol.type === "Gazetted" ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/10">
                              Gazetted
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                              Restricted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Holiday Modal Dialog */}
          <Dialog open={isHolidayModalOpen} onOpenChange={setIsHolidayModalOpen}>
            <DialogContent className="max-w-md !overflow-visible select-none">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <PlusCircle className="h-4.5 w-4.5 text-primary" />
                  Add Company Holiday
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 leading-relaxed mt-1">
                  Schedule a new official company-wide or branch-specific holiday on the corporate calendar.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddHoliday} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Holiday Occasion Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                    placeholder="e.g. Diwali Festival"
                    className="block w-full rounded-xl border border-border bg-transparent px-3.5 py-2 text-xs outline-none focus:border-primary/45"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Holiday Date
                  </label>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <input
                      type="date"
                      required
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="block w-full rounded-xl border border-border bg-transparent pl-9 pr-3.5 py-2 text-xs outline-none focus:border-primary/45 cursor-pointer text-slate-600 dark:text-slate-350 select-none [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <CustomSelect
                    label="Holiday Classification"
                    value={newHolidayType}
                    options={holidayTypeOptions}
                    onChange={setNewHolidayType}
                  />

                  <CustomSelect
                    label="Branch Applicability"
                    value={newHolidayBranch}
                    options={[
                      { value: "All", label: "All Branches", description: "Applicable to all office locations" },
                      ...branches.map((b) => ({
                        value: b.name,
                        label: b.name,
                        description: b.address
                      }))
                    ]}
                    onChange={setNewHolidayBranch}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsHolidayModalOpen(false)}
                    className="w-full text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !newHolidayName.trim() || !newHolidayDate}
                    className="btn-primary w-full text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                  >
                    {loading ? "Adding..." : "Add Holiday"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Holiday Modal Dialog */}
          <Dialog open={!!editHoliday} onOpenChange={(open) => !open && setEditHoliday(null)}>
            <DialogContent className="max-w-md !overflow-visible select-none">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Edit className="h-4.5 w-4.5 text-primary" />
                  Edit Company Holiday
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 leading-relaxed mt-1">
                  Modify the scheduled company-wide or branch-specific holiday occasion details.
                </DialogDescription>
              </DialogHeader>

              {editHoliday && (
                <form onSubmit={handleEditHoliday} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Holiday Occasion Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editHoliday.name}
                      onChange={(e) => setEditHoliday({ ...editHoliday, name: e.target.value })}
                      placeholder="e.g. Diwali Festival"
                      className="block w-full rounded-xl border border-border bg-transparent px-3.5 py-2 text-xs outline-none focus:border-primary/45"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Holiday Date
                    </label>
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <input
                        type="date"
                        required
                        value={editHoliday.date}
                        onChange={(e) => setEditHoliday({ ...editHoliday, date: e.target.value })}
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        className="block w-full rounded-xl border border-border bg-transparent pl-9 pr-3.5 py-2 text-xs outline-none focus:border-primary/45 cursor-pointer text-slate-650 dark:text-slate-350 select-none [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <CustomSelect
                      label="Holiday Classification"
                      value={editHoliday.type}
                      options={holidayTypeOptions}
                      onChange={(val) => setEditHoliday({ ...editHoliday, type: val })}
                    />

                    <CustomSelect
                      label="Branch Applicability"
                      value={editHoliday.branchId || "All"}
                      options={[
                        { value: "All", label: "All Branches", description: "Applicable to all office locations" },
                        ...branches.map((b) => ({
                          value: b.name,
                          label: b.name,
                          description: b.address
                        }))
                      ]}
                      onChange={(val) => setEditHoliday({ ...editHoliday, branchId: val })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditHoliday(null)}
                      className="w-full text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !editHoliday.name.trim() || !editHoliday.date}
                      className="btn-primary w-full text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Custom Holiday Delete Confirmation Modal */}
          {holidayToDelete && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-background border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-3 rounded-full bg-rose-500/10 text-rose-500 ring-4 ring-rose-500/5">
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                      Delete Company Holiday?
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Are you sure you want to remove the holiday <strong className="text-foreground">"{holidayToDelete.name}"</strong>? This will delete the holiday from the corporate calendar and cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-3 w-full pt-2">
                    <button
                      type="button"
                      onClick={() => setHolidayToDelete(null)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-border text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteHoliday(holidayToDelete.id);
                        setHolidayToDelete(null);
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
        </div>
      )}
    </div>
  );
}
