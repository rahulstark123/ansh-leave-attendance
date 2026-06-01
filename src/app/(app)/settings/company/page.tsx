"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLeaveStore } from "@/stores/leave-store";
import { Loader2, Building, Building2, MapPin, Users, CheckCircle, ShieldAlert, Plus, Trash2 } from "lucide-react";
import { Branch } from "@/lib/settings";

export default function CompanySettingPage() {
  const { currentUser, initialize } = useLeaveStore();

  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [employeeCount, setEmployeeCount] = useState("1-10");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Add branch form state
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const isAuthorized = currentUser?.role === "HR Manager" || currentUser?.role === "Admin";

  useEffect(() => {
    if (currentUser) {
      const emp = currentUser as any;
      setCompanyName(emp.companyName || "");
      setCompanyAddress(emp.companyAddress || "");
      setEmployeeCount(emp.employeeCount || "1-10");
    }
  }, [currentUser]);

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        const token = sessionStorage.getItem("ansh_auth_token");
        const [settingsRes, employeesRes] = await Promise.all([
          fetch("/api/settings", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/employees", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.settings?.branches) {
            setBranches(data.settings.branches);
          }
        }
        if (employeesRes.ok) {
          const data = await employeesRes.json();
          setEmployees(data.employees || []);
        }
      } catch (error) {
        console.error("Failed to load company data:", error);
      }
    };
    loadCompanyData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!isAuthorized) {
      setErrorMsg("You do not have permission to edit company settings.");
      return;
    }

    if (!companyName.trim()) {
      setErrorMsg("Company Name is required.");
      return;
    }

    if (!companyAddress.trim()) {
      setErrorMsg("Company Address is required.");
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: currentUser.name,
          department: currentUser.department,
          role: currentUser.role,
          companyName: companyName.trim(),
          companyAddress: companyAddress.trim(),
          employeeCount,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save company settings");
      }

      await initialize();
      setSuccessMsg("Company settings updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while saving company settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBranches = async (updatedBranches: Branch[]) => {
    setBranchLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          branches: updatedBranches
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save branches settings");
      }

      const data = await res.json();
      if (data.settings?.branches) {
        setBranches(data.settings.branches);
      }
      setSuccessMsg("Branches registry synchronized successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to synchronize branch data.");
    } finally {
      setBranchLoading(false);
    }
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchAddress.trim()) return;

    if (!isAuthorized) {
      setErrorMsg("You do not have permission to modify branches.");
      return;
    }

    const newBranch: Branch = {
      id: `branch-${Date.now()}`,
      name: newBranchName.trim(),
      address: newBranchAddress.trim()
    };

    const updated = [...branches, newBranch];
    setBranches(updated);
    handleSaveBranches(updated);
    
    setNewBranchName("");
    setNewBranchAddress("");
  };

  const handleDeleteBranch = (id: string) => {
    if (!isAuthorized) {
      setErrorMsg("You do not have permission to modify branches.");
      return;
    }

    const updated = branches.filter(b => b.id !== id);
    setBranches(updated);
    handleSaveBranches(updated);
  };

  const getBranchHeadcount = (branchName: string) => {
    return employees.filter(e => e.branch === branchName).length;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Organization Settings"
        title="Company Setting"
        description="Configure your organization's legal identity, headquarters address, employee headcount, and office branches registry."
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

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Organization Identity */}
        <Card className="crm-card h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Building className="h-4.5 w-4.5 text-primary" />
              Organization Identity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isAuthorized && (
              <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-xs font-bold text-amber-500 mb-6 flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
                Only Administrators and HR Managers can edit company configuration details.
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* COMPANY NAME */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Company Name
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Building className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    disabled={!isAuthorized}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. ANSH Solutions"
                    className="block w-full rounded-2xl border border-border bg-transparent pl-11 pr-4 py-3.5 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* EMPLOYEE SIZE */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Company Employee Size
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Users className="h-4 w-4" />
                  </div>
                  <select
                    disabled={!isAuthorized}
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(e.target.value)}
                    className="block w-full rounded-2xl border border-border bg-transparent pl-11 pr-4 py-3.5 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer"
                  >
                    <option value="1-10">1 - 10 employees</option>
                    <option value="11-50">11 - 50 employees</option>
                    <option value="51-200">51 - 200 employees</option>
                    <option value="200+">200+ employees</option>
                  </select>
                </div>
              </div>

              {/* COMPANY ADDRESS */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Headquarters Address
                </label>
                <div className="mt-2 relative">
                  <div className="absolute top-3.5 left-3.5 text-slate-500">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <textarea
                    required
                    disabled={!isAuthorized}
                    rows={3}
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="e.g. 123 Business Park, Mumbai, India"
                    className="block w-full rounded-2xl border border-border bg-transparent pl-11 pr-4 py-3.5 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed resize-none"
                  />
                </div>
              </div>

              {isAuthorized && (
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full md:w-auto font-bold text-xs uppercase tracking-wider h-11 px-8"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving changes...
                      </>
                    ) : (
                      "Save Company Details"
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Office Branches Manager */}
        <Card className="crm-card h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-primary" />
              Office Branches Registry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-xs text-slate-400">
              Manage different geographic offices or branches. These branch destinations can be assigned to directory profiles and linked with localized holiday schedules.
            </p>

            {/* Branches List */}
            <div className="space-y-3">
              {branches.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-border/50">
                  No office branches defined yet. Register one below.
                </div>
              ) : (
                branches.map((branch) => {
                  const count = getBranchHeadcount(branch.name);
                  return (
                    <div
                      key={branch.id}
                      className="flex items-start justify-between p-4 rounded-2xl border border-border bg-card hover:shadow-sm transition-all duration-300"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                            {branch.name}
                          </span>
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary rounded-md flex items-center gap-1">
                            <Users className="h-2.5 w-2.5" />
                            {count} Employee{count !== 1 && "s"}
                          </span>
                        </div>
                        <span className="block text-[10px] text-slate-400 truncate leading-relaxed text-left">
                          {branch.address}
                        </span>
                      </div>
                      
                      {isAuthorized && (
                        <button
                          onClick={() => handleDeleteBranch(branch.id)}
                          disabled={branchLoading}
                          className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                          title="Delete Branch"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Branch Form */}
            {isAuthorized && (
              <form onSubmit={handleAddBranch} className="space-y-4 pt-4 border-t border-border/40">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  Add Office Branch
                </h4>
                
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="e.g. Mumbai Corporate Hub"
                    className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                    Branch Location Address
                  </label>
                  <input
                    type="text"
                    required
                    value={newBranchAddress}
                    onChange={(e) => setNewBranchAddress(e.target.value)}
                    placeholder="e.g. Floor 12, Maker Chambers, Nariman Point, Mumbai"
                    className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={branchLoading || !newBranchName.trim() || !newBranchAddress.trim()}
                  className="btn-primary w-full text-xs font-bold uppercase tracking-wider h-11 cursor-pointer"
                >
                  {branchLoading ? "Saving..." : "Add Office Branch"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
