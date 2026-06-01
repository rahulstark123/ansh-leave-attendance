"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileText,
  Check,
  Globe,
  PlusCircle,
  Clock,
  Sparkles
} from "lucide-react";

import { CustomLeaveType, PolicyDocument, CompanyHoliday } from "@/lib/settings";

export default function LeaveSettingPage() {
  const { currentUser, initialize } = useLeaveStore();
  const isAuthorized = currentUser?.role === "HR Manager" || currentUser?.role === "Admin";

  const [activeTab, setActiveTab] = useState<"types" | "policies" | "holidays">("types");

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
  const [uploadProgress, setUploadProgress] = useState(-1);
  const [uploading, setUploading] = useState(false);

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
              setCustomLeaveTypes(data.settings.leaveSettings.customLeaveTypes || []);
              setPolicyDocuments(data.settings.leaveSettings.policyDocuments || []);
              setCompanyHolidays(data.settings.leaveSettings.companyHolidays || []);
            }
            if (data.settings.branches) {
              setBranches(data.settings.branches);
            }
          }
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
            customLeaveTypes,
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
        setCustomLeaveTypes(data.settings.leaveSettings.customLeaveTypes || []);
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


  const handleAddLeaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    const newType: CustomLeaveType = {
      id: `clt-${Date.now()}`,
      name: newTypeName.trim(),
      days: parseInt(newTypeDays) || 0,
      color: newTypeColor,
      allowRollover: newTypeRollover,
      description: newTypeDescription.trim() || undefined,
      applicableGender: newTypeGender,
      accrualPolicy: newTypeAccrual,
      requiresProof: newTypeRequiresProof
    };

    const updatedTypes = [...customLeaveTypes, newType];
    setCustomLeaveTypes(updatedTypes);
    handleSaveCustom({ customLeaveTypes: updatedTypes });
    
    setNewTypeName("");
    setNewTypeDays("10");
    setNewTypeColor("purple");
    setNewTypeRollover(false);
    setNewTypeDescription("");
    setNewTypeGender("All");
    setNewTypeAccrual("One-time");
    setNewTypeRequiresProof(false);
  };

  const handleDeleteLeaveType = (id: string) => {
    const updatedTypes = customLeaveTypes.filter((t) => t.id !== id);
    setCustomLeaveTypes(updatedTypes);
    handleSaveCustom({ customLeaveTypes: updatedTypes });
  };

  const handleUploadPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim()) return;
    
    setUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          
          const newDoc: PolicyDocument = {
            id: `doc-${Date.now()}`,
            name: uploadFileName.endsWith(".pdf") ? uploadFileName.trim() : `${uploadFileName.trim()}.pdf`,
            uploadedAt: new Date().toISOString().split("T")[0],
            size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`
          };

          const updatedDocs = [...policyDocuments, newDoc];
          setPolicyDocuments(updatedDocs);
          handleSaveCustom({ policyDocuments: updatedDocs });
          
          setUploading(false);
          setUploadProgress(-1);
          setUploadFileName("");
          return -1;
        }
        return prev + 10;
      });
    }, 120);
  };

  const handleDeletePolicy = (id: string) => {
    const updatedDocs = policyDocuments.filter((d) => d.id !== id);
    setPolicyDocuments(updatedDocs);
    handleSaveCustom({ policyDocuments: updatedDocs });
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName.trim() || !newHolidayDate) return;

    const newHol: CompanyHoliday = {
      id: `hol-${Date.now()}`,
      name: newHolidayName.trim(),
      date: newHolidayDate,
      type: newHolidayType,
      branchId: newHolidayBranch
    };

    const updatedHols = [...companyHolidays, newHol].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setCompanyHolidays(updatedHols);
    handleSaveCustom({ companyHolidays: updatedHols });

    setNewHolidayName("");
    setNewHolidayDate("");
    setNewHolidayType("Gazetted");
    setNewHolidayBranch("All");
  };

  const handleDeleteHoliday = (id: string) => {
    const updatedHols = companyHolidays.filter((h) => h.id !== id);
    setCompanyHolidays(updatedHols);
    handleSaveCustom({ companyHolidays: updatedHols });
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
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="crm-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-primary" />
                  Leave Types Manager
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-400 mb-4">
                  Configure corporate leave categories, days allocation pools, gender restrictions, and documentation verification requirements.
                </p>

                {customLeaveTypes.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-border/50">
                    No custom leave types defined. Create one on the right configurator panel.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
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
                              <button
                                onClick={() => handleDeleteLeaveType(type.id)}
                                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete Custom Leave"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
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
          </div>

          <div className="lg:col-span-1">
            <Card className="crm-card">
              <CardHeader className="flex flex-row items-center gap-2">
                <PlusCircle className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Add Leave Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isAuthorized ? (
                  <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-xs font-bold text-amber-500 flex items-start gap-2">
                    <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>Only HR managers can define and register new custom leave pools.</span>
                  </div>
                ) : (
                  <form onSubmit={handleAddLeaveType} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Leave Type Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        placeholder="e.g. Study Leave"
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Description / Guidelines
                      </label>
                      <textarea
                        value={newTypeDescription}
                        onChange={(e) => setNewTypeDescription(e.target.value)}
                        placeholder="Explain when employees can request this leave..."
                        rows={3}
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45 resize-none"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                          Days Allowance
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          required
                          value={newTypeDays}
                          onChange={(e) => setNewTypeDays(e.target.value)}
                          className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                          Color Theme
                        </label>
                        <select
                          value={newTypeColor}
                          onChange={(e) => setNewTypeColor(e.target.value)}
                          className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                        >
                          <option value="purple">Purple Theme</option>
                          <option value="indigo">Indigo Theme</option>
                          <option value="pink">Pink Theme</option>
                          <option value="slate">Slate Theme</option>
                          <option value="amber">Amber Theme</option>
                          <option value="emerald">Emerald Theme</option>
                          <option value="sky">Sky Theme</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                          Gender Eligibility
                        </label>
                        <select
                          value={newTypeGender}
                          onChange={(e) => setNewTypeGender(e.target.value)}
                          className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                        >
                          <option value="All">All Employees</option>
                          <option value="Female">Female Only</option>
                          <option value="Male">Male Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                          Accrual Strategy
                        </label>
                        <select
                          value={newTypeAccrual}
                          onChange={(e) => setNewTypeAccrual(e.target.value)}
                          className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                        >
                          <option value="One-time">One-time Grant</option>
                          <option value="Monthly">Monthly Accrual</option>
                          <option value="Yearly">Yearly Grant</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 py-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="rollover"
                          checked={newTypeRollover}
                          onChange={(e) => setNewTypeRollover(e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                        <label htmlFor="rollover" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                          Allow Rollover / Carry-forward
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="requiresProof"
                          checked={newTypeRequiresProof}
                          onChange={(e) => setNewTypeRequiresProof(e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                        <label htmlFor="requiresProof" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                          Requires Documentation Proof
                        </label>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !newTypeName.trim()}
                      className="btn-primary w-full text-xs font-bold uppercase tracking-wider h-11 cursor-pointer"
                    >
                      {loading ? "Adding..." : "Add Leave Type"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 3. POLICY DOCUMENT HUB TAB */}
      {activeTab === "policies" && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="crm-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-primary" />
                  Leave Policies & Employee Handbooks
                </CardTitle>
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
                          onClick={() => alert(`Simulating download for: ${doc.name}`)}
                          className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        {isAuthorized && (
                          <button
                            onClick={() => handleDeletePolicy(doc.id)}
                            className="h-8 w-8 rounded-lg bg-rose-50/10 hover:bg-rose-50/20 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete Document"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="crm-card">
              <CardHeader className="flex flex-row items-center gap-2">
                <UploadCloud className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Upload Policy Handbook
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isAuthorized ? (
                  <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-xs font-bold text-amber-500 flex items-start gap-2">
                    <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>Only HR managers can upload new policy guideline documents.</span>
                  </div>
                ) : (
                  <form onSubmit={handleUploadPolicy} className="space-y-4">
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
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45 disabled:opacity-60"
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

                    <Button
                      type="submit"
                      disabled={uploading || !uploadFileName.trim()}
                      className="btn-primary w-full text-xs font-bold uppercase tracking-wider h-11 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Simulating Upload...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4" />
                          Upload Policy PDF
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 4. COMPANY HOLIDAYS TAB */}
      {activeTab === "holidays" && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="crm-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-primary" />
                  Official Holiday Schedule (2026)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-400 mb-2">
                  Listed below are the official company-wide holidays. These days are registered on the main Leave calendar as non-working days.
                </p>

                {companyHolidays.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-border/50">
                    No holidays scheduled. Create one on the right planner panel.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {companyHolidays.map((hol) => (
                      <div
                        key={hol.id}
                        className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-extrabold text-xs">
                            {new Date(hol.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                              {hol.name}
                            </span>
                            <span className="block text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wide">
                              {new Date(hol.date).toLocaleDateString("en-US", { weekday: "long" })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {hol.branchId && hol.branchId !== "All" ? (
                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/10">
                              {hol.branchId}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                              All Branches
                            </span>
                          )}
                          {hol.type === "Gazetted" ? (
                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/10">
                              Gazetted
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                              Restricted
                            </span>
                          )}
                          {isAuthorized && (
                            <button
                              onClick={() => handleDeleteHoliday(hol.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                              title="Delete Holiday"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="crm-card">
              <CardHeader className="flex flex-row items-center gap-2">
                <PlusCircle className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Schedule Holiday
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isAuthorized ? (
                  <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-xs font-bold text-amber-500 flex items-start gap-2">
                    <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>Only HR managers can add holidays to the corporate calendar.</span>
                  </div>
                ) : (
                  <form onSubmit={handleAddHoliday} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Holiday Occasion Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newHolidayName}
                        onChange={(e) => setNewHolidayName(e.target.value)}
                        placeholder="e.g. Diwali Festival"
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Holiday Date
                      </label>
                      <input
                        type="date"
                        required
                        value={newHolidayDate}
                        onChange={(e) => setNewHolidayDate(e.target.value)}
                        className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer text-slate-600 dark:text-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Holiday Classification
                      </label>
                      <select
                        value={newHolidayType}
                        onChange={(e) => setNewHolidayType(e.target.value)}
                        className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                      >
                        <option value="Gazetted">Gazetted Holiday (Mandatory)</option>
                        <option value="Restricted">Restricted Holiday (Optional)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Branch Applicability
                      </label>
                      <select
                        value={newHolidayBranch}
                        onChange={(e) => setNewHolidayBranch(e.target.value)}
                        className="block w-full rounded-2xl border border-border bg-card dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-primary/45 cursor-pointer"
                      >
                        <option value="All">All Branches</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !newHolidayName.trim() || !newHolidayDate}
                      className="btn-primary w-full text-xs font-bold uppercase tracking-wider h-11 cursor-pointer"
                    >
                      {loading ? "Scheduling..." : "Add to Calendar"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
