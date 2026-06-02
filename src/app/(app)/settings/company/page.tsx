"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLeaveStore } from "@/stores/leave-store";
import { Loader2, Building, Building2, MapPin, Users, CheckCircle, ShieldAlert, Plus, Trash2 } from "lucide-react";
import { Branch } from "@/lib/settings";

interface MapLocationResult {
  id: string;
  label: string;
  lat: number;
  lon: number;
  city?: string;
  state?: string;
  pincode?: string;
}

export default function CompanySettingPage() {
  const { currentUser, initialize } = useLeaveStore();

  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [employeeCount, setEmployeeCount] = useState("1-10");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Expanded Company Profile states
  const [industry, setIndustry] = useState("");
  const [foundYear, setFoundYear] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Add branch form state
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [newBranchCity, setNewBranchCity] = useState("");
  const [newBranchState, setNewBranchState] = useState("");
  const [newBranchPincode, setNewBranchPincode] = useState("");
  const [newBranchLatitude, setNewBranchLatitude] = useState<number | undefined>(undefined);
  const [newBranchLongitude, setNewBranchLongitude] = useState<number | undefined>(undefined);
  const [mapQuery, setMapQuery] = useState("");
  const [mapLoading, setMapLoading] = useState(false);
  const [mapResults, setMapResults] = useState<MapLocationResult[]>([]);
  const [selectedMapLocation, setSelectedMapLocation] = useState<MapLocationResult | null>(null);

  const [toasts, setToasts] = useState<Array<{ id: string; type: "success" | "error"; title: string; message: string }>>([]);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  const [loading, setLoading] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const isAuthorized = currentUser?.role === "HR Manager" || currentUser?.role === "Admin";

  const showToast = (type: "success" | "error", title: string, message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Pincode lookup auto-fill
  useEffect(() => {
    if (newBranchPincode.length === 6 && /^\d+$/.test(newBranchPincode)) {
      const fetchLocation = async () => {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${newBranchPincode}`);
          if (res.ok) {
            const data = await res.json();
            if (data[0] && data[0].Status === "Success" && data[0].PostOffice?.[0]) {
              const po = data[0].PostOffice[0];
              setNewBranchCity(po.District || po.Division || "");
              setNewBranchState(po.State || "");
              showToast("success", "Pincode Auto-filled", `Location set to ${po.District}, ${po.State}`);
            } else {
              showToast("error", "Invalid Pincode", "No postal records found for this pincode.");
            }
          }
        } catch (err) {
          console.error("Pincode lookup error:", err);
        }
      };
      fetchLocation();
    }
  }, [newBranchPincode]);

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
          if (data.settings?.companyProfile) {
            const profile = data.settings.companyProfile;
            setCompanyName(profile.name || "");
            setCompanyAddress(profile.address || "");
            setEmployeeCount(profile.employeeCount || "1-10");
            setIndustry(profile.industry || "");
            setFoundYear(profile.foundYear || "");
            setRegistrationNumber(profile.registrationNumber || "");
            setContactEmail(profile.contactEmail || "");
            setContactPhone(profile.contactPhone || "");
            setWebsiteUrl(profile.websiteUrl || "");
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
      showToast("error", "Access Denied", "You do not have permission to edit company settings.");
      return;
    }

    if (!companyName.trim()) {
      setErrorMsg("Company Name is required.");
      showToast("error", "Validation Error", "Company Name is required.");
      return;
    }

    if (!companyAddress.trim()) {
      setErrorMsg("Company Address is required.");
      showToast("error", "Validation Error", "Company Address is required.");
      return;
    }

    loading || setLoading(true);

    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      
      const onboardPromise = fetch("/api/auth/onboard", {
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

      const settingsPromise = fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyProfile: {
            name: companyName.trim(),
            address: companyAddress.trim(),
            employeeCount,
            industry: industry.trim(),
            foundYear: foundYear.trim(),
            registrationNumber: registrationNumber.trim(),
            contactEmail: contactEmail.trim(),
            contactPhone: contactPhone.trim(),
            websiteUrl: websiteUrl.trim(),
          }
        }),
      });

      const [onboardRes, settingsRes] = await Promise.all([onboardPromise, settingsPromise]);

      if (!onboardRes.ok || !settingsRes.ok) {
        throw new Error("Failed to save full company settings profile");
      }

      await initialize();
      setSuccessMsg("Company settings profile updated successfully!");
      showToast("success", "Settings Saved", "Full company settings profile successfully updated.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while saving company settings.");
      showToast("error", "Error Saving", "Failed to save company settings.");
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
      showToast("error", "Sync Failure", "Failed to sync branch registry changes.");
    } finally {
      setBranchLoading(false);
    }
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchAddress.trim()) {
      showToast("error", "Validation Error", "Branch name and address location are required.");
      return;
    }

    if (!isAuthorized) {
      setErrorMsg("You do not have permission to modify branches.");
      showToast("error", "Access Denied", "You do not have permission to modify branches.");
      return;
    }

    const newBranch: Branch = {
      id: `branch-${Date.now()}`,
      name: newBranchName.trim(),
      address: newBranchAddress.trim(),
      city: newBranchCity.trim() || undefined,
      state: newBranchState.trim() || undefined,
      pincode: newBranchPincode.trim() || undefined,
      latitude: newBranchLatitude,
      longitude: newBranchLongitude,
    };

    const updated = [...branches, newBranch];
    setBranches(updated);
    handleSaveBranches(updated);
    showToast("success", "Branch Added", `Branch "${newBranchName}" added successfully.`);
    
    setNewBranchName("");
    setNewBranchAddress("");
    setNewBranchCity("");
    setNewBranchState("");
    setNewBranchPincode("");
    setNewBranchLatitude(undefined);
    setNewBranchLongitude(undefined);
    setMapQuery("");
    setMapResults([]);
    setSelectedMapLocation(null);
  };

  const handleMapSearch = async () => {
    if (!mapQuery.trim()) {
      showToast("error", "Location Required", "Type office locality, area, or city to search on map.");
      return;
    }
    setMapLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=in&q=${encodeURIComponent(mapQuery.trim())}`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
        }
      });
      if (!res.ok) {
        throw new Error("Failed to search map locations");
      }
      const data = await res.json();
      const parsed: MapLocationResult[] = (Array.isArray(data) ? data : []).map((item: any, index: number) => {
        const cityName =
          item.address?.city ||
          item.address?.town ||
          item.address?.village ||
          item.address?.municipality ||
          item.address?.county ||
          "";
        return {
          id: item.place_id ? String(item.place_id) : `loc-${index}-${Date.now()}`,
          label: item.display_name || "Unnamed location",
          lat: Number(item.lat),
          lon: Number(item.lon),
          city: cityName || undefined,
          state: item.address?.state || undefined,
          pincode: item.address?.postcode || undefined,
        };
      }).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));
      setMapResults(parsed);
      if (parsed.length === 0) {
        showToast("error", "No Results", "No matching map locations found. Try a more specific search.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Map Search Failed", "Unable to fetch map results right now.");
    } finally {
      setMapLoading(false);
    }
  };

  const handleSelectMapLocation = (location: MapLocationResult) => {
    setSelectedMapLocation(location);
    setNewBranchAddress(location.label);
    setNewBranchCity(location.city || "");
    setNewBranchState(location.state || "");
    setNewBranchPincode(location.pincode || "");
    setNewBranchLatitude(location.lat);
    setNewBranchLongitude(location.lon);
    showToast("success", "Location Selected", "Branch location fields auto-filled from map selection.");
  };

  const getMapEmbedUrl = (lat: number, lon: number) => {
    const delta = 0.01;
    const left = lon - delta;
    const right = lon + delta;
    const top = lat + delta;
    const bottom = lat - delta;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
  };

  const handleDeleteBranch = (id: string) => {
    if (!isAuthorized) {
      setErrorMsg("You do not have permission to modify branches.");
      showToast("error", "Access Denied", "You do not have permission to delete branches.");
      return;
    }

    const target = branches.find(b => b.id === id);
    if (target) {
      setBranchToDelete(target);
    }
  };

  const confirmDeleteBranch = () => {
    if (!branchToDelete) return;
    const updated = branches.filter(b => b.id !== branchToDelete.id);
    setBranches(updated);
    handleSaveBranches(updated);
    showToast("success", "Branch Deleted", `Branch "${branchToDelete.name}" has been deleted.`);
    setBranchToDelete(null);
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

              {/* Additional Company Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/40 pt-4">
                {/* INDUSTRY */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Industry Type
                  </label>
                  <input
                    type="text"
                    disabled={!isAuthorized}
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Software & Technology"
                    className="mt-2 block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs text-foreground outline-none focus:border-primary/45 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* FOUND YEAR */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Found Year
                  </label>
                  <input
                    type="text"
                    disabled={!isAuthorized}
                    value={foundYear}
                    onChange={(e) => setFoundYear(e.target.value)}
                    placeholder="e.g. 2021"
                    className="mt-2 block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs text-foreground outline-none focus:border-primary/45 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* REGISTRATION ID / TAX NUMBER */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Registration Number (CIN/GST)
                  </label>
                  <input
                    type="text"
                    disabled={!isAuthorized}
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. CIN-U72900MH2021PTC361284"
                    className="mt-2 block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs text-foreground outline-none focus:border-primary/45 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* WEBSITE URL */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Website URL
                  </label>
                  <input
                    type="url"
                    disabled={!isAuthorized}
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="e.g. https://ansh.com"
                    className="mt-2 block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs text-foreground outline-none focus:border-primary/45 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* CONTACT EMAIL */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Corporate Email Address
                  </label>
                  <input
                    type="email"
                    disabled={!isAuthorized}
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. info@company.com"
                    className="mt-2 block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs text-foreground outline-none focus:border-primary/45 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* CONTACT PHONE */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Corporate Phone Number
                  </label>
                  <input
                    type="tel"
                    disabled={!isAuthorized}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. +91 22 4567 8901"
                    className="mt-2 block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs text-foreground outline-none focus:border-primary/45 disabled:opacity-60 disabled:cursor-not-allowed"
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
                        <span className="block text-[10px] text-slate-400 leading-relaxed text-left">
                          {branch.address}
                          {(branch.city || branch.state || branch.pincode) && (
                            <span className="block mt-0.5 text-slate-500 text-[9px] font-medium">
                              {[branch.city, branch.state, branch.pincode].filter(Boolean).join(", ")}
                            </span>
                          )}
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

                {/* PIN CODE (Comes first for lookup auto-fill) */}
                <div className="space-y-2.5 rounded-2xl border border-border/60 p-3.5 bg-slate-50/40 dark:bg-slate-900/20">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    Office Location Chooser (Map)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mapQuery}
                      onChange={(e) => setMapQuery(e.target.value)}
                      placeholder="Search area, road, city, or landmark"
                      className="block w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-xs outline-none focus:border-primary/45"
                    />
                    <Button
                      type="button"
                      onClick={handleMapSearch}
                      disabled={mapLoading || !mapQuery.trim()}
                      className="h-10 px-4 text-[10px] font-bold uppercase tracking-wider"
                    >
                      {mapLoading ? "Searching" : "Search"}
                    </Button>
                  </div>
                  {mapResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {mapResults.map((location) => (
                        <button
                          key={location.id}
                          type="button"
                          onClick={() => handleSelectMapLocation(location)}
                          className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-left text-[10px] hover:border-primary/45 hover:bg-primary/5 transition-colors"
                        >
                          {location.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedMapLocation && (
                    <div className="space-y-2">
                      <div className="rounded-xl overflow-hidden border border-border/70">
                        <iframe
                          title="Selected office location map preview"
                          src={getMapEmbedUrl(selectedMapLocation.lat, selectedMapLocation.lon)}
                          className="h-44 w-full"
                          loading="lazy"
                        />
                      </div>
                      <p className="text-[9px] text-slate-500">
                        Selected coordinates: {selectedMapLocation.lat.toFixed(6)}, {selectedMapLocation.lon.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1">
                    Pin Code (Auto-fills City & State)
                  </label>
                  <input
                    type="text"
                    required
                    value={newBranchPincode}
                    onChange={(e) => setNewBranchPincode(e.target.value)}
                    placeholder="e.g. 400021"
                    maxLength={6}
                    className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                  />
                </div>

                {/* City and State row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={newBranchCity}
                      onChange={(e) => setNewBranchCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="block w-full rounded-2xl border border-border bg-transparent px-3 py-3 text-xs outline-none focus:border-primary/45"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={newBranchState}
                      onChange={(e) => setNewBranchState(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="block w-full rounded-2xl border border-border bg-transparent px-3 py-3 text-xs outline-none focus:border-primary/45"
                    />
                  </div>
                </div>

                {/* Branch Name */}
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

                {/* Branch Location Address */}
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                    Branch Location Address
                  </label>
                  <input
                    type="text"
                    required
                    value={newBranchAddress}
                    onChange={(e) => setNewBranchAddress(e.target.value)}
                    placeholder="e.g. Floor 12, Maker Chambers, Nariman Point"
                    className="block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-xs outline-none focus:border-primary/45"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={branchLoading || !newBranchName.trim() || !newBranchAddress.trim() || !selectedMapLocation}
                  className="btn-primary w-full text-xs font-bold uppercase tracking-wider h-11 cursor-pointer"
                >
                  {branchLoading ? "Saving..." : "Add Office Branch"}
                </Button>
                {!selectedMapLocation && (
                  <p className="text-[10px] text-slate-400">
                    Select office location from map before adding branch.
                  </p>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {branchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 rounded-full bg-rose-500/10 text-rose-500 ring-4 ring-rose-500/5">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Delete Office Branch?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to remove the <strong className="text-foreground">"{branchToDelete.name}"</strong> branch? This action will remove the branch registry and cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={() => setBranchToDelete(null)}
                  className="flex-1 py-3 px-4 rounded-2xl border border-border text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteBranch}
                  className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-lg animate-in slide-in-from-right duration-300 ${
              toast.type === "success"
                ? "border-emerald-500/20 bg-emerald-950/70 text-emerald-300"
                : "border-rose-500/20 bg-rose-950/70 text-rose-300"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 text-left">
              <h5 className="text-xs font-black uppercase tracking-wider">{toast.title}</h5>
              <p className="text-[11px] text-slate-200 leading-normal">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
