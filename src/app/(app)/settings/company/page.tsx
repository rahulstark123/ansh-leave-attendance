"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLeaveStore } from "@/stores/leave-store";
import { Loader2, Building, Building2, MapPin, Users, CheckCircle, ShieldAlert, Plus, Trash2, X } from "lucide-react";
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
  const [newBranchAllowWFH, setNewBranchAllowWFH] = useState(false);

  // Leaflet Map Modal states
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalSearchLoading, setModalSearchLoading] = useState(false);
  const [modalSearchResults, setModalSearchResults] = useState<any[]>([]);

  const [tempLat, setTempLat] = useState<number>(19.0760);
  const [tempLng, setTempLng] = useState<number>(72.8777);
  const [tempAddress, setTempAddress] = useState("");
  const [tempCity, setTempCity] = useState("");
  const [tempState, setTempState] = useState("");
  const [tempPincode, setTempPincode] = useState("");

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(cssLink);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      setIsLeafletLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.county || "";
        const state = address.state || "";
        const pincode = address.postcode || "";
        const displayName = data.display_name || "";
        setTempAddress(displayName);
        setTempCity(city);
        setTempState(state);
        setTempPincode(pincode);
      }
    } catch (err) {
      console.error("Reverse geocode failed:", err);
    }
  };

  const handleModalSearch = async () => {
    if (!modalSearchQuery.trim()) return;
    setModalSearchLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=in&q=${encodeURIComponent(modalSearchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setModalSearchResults(data);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setModalSearchLoading(false);
    }
  };

  const selectModalSearchResult = async (result: any) => {
    const lat = Number(result.lat);
    const lon = Number(result.lon);
    setTempLat(lat);
    setTempLng(lon);
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lon], 16);
      markerRef.current.setLatLng([lat, lon]);
    }
    const address = result.address || {};
    const city = address.city || address.town || address.village || address.county || "";
    const state = address.state || "";
    const pincode = address.postcode || "";
    setTempAddress(result.display_name || "");
    setTempCity(city);
    setTempState(state);
    setTempPincode(pincode);
    setModalSearchResults([]);
  };

  const initLeafletMap = (containerId: string, initialLat: number, initialLng: number) => {
    const L = (window as any).L;
    if (!L) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }
    const map = L.map(containerId).setView([initialLat, initialLng], 13);
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OpenStreetMap"
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    const DefaultIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    marker.setIcon(DefaultIcon);

    marker.on("dragend", async () => {
      const pos = marker.getLatLng();
      setTempLat(pos.lat);
      setTempLng(pos.lng);
      await reverseGeocode(pos.lat, pos.lng);
    });

    map.on("click", async (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setTempLat(lat);
      setTempLng(lng);
      await reverseGeocode(lat, lng);
    });
  };

  useEffect(() => {
    if (isMapModalOpen && isLeafletLoaded) {
      const timer = setTimeout(() => {
        const initialLat = tempLat || 19.0760;
        const initialLng = tempLng || 72.8777;
        initLeafletMap("leaflet-modal-map", initialLat, initialLng);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMapModalOpen, isLeafletLoaded]);

  const [toasts, setToasts] = useState<Array<{ id: string; type: "success" | "error"; title: string; message: string }>>([]);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  const [loading, setLoading] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const isAuthorized = currentUser?.role === "HR Manager" || currentUser?.role === "Admin" || currentUser?.role === "Owner";

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
      allowWFH: newBranchAllowWFH,
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
    setNewBranchAllowWFH(false);
    setMapQuery("");
    setMapResults([]);
    setSelectedMapLocation(null);
    setIsAddBranchModalOpen(false);
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
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-primary" />
              Office Branches
            </CardTitle>
            {isAuthorized && (
              <button
                type="button"
                onClick={() => {
                  setNewBranchName("");
                  setNewBranchAddress("");
                  setNewBranchCity("");
                  setNewBranchState("");
                  setNewBranchPincode("");
                  setNewBranchLatitude(undefined);
                  setNewBranchLongitude(undefined);
                  setSelectedMapLocation(null);
                  setIsAddBranchModalOpen(true);
                }}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Branch
              </button>
            )}
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
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                            branch.allowWFH !== false
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-450"
                          }`}>
                            WFH: {branch.allowWFH !== false ? "Allowed" : "Not Allowed"}
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


          </CardContent>
        </Card>
      </div>

      {/* Add Branch Modal */}
      {isAddBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <Card className="crm-card max-w-lg w-full bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-primary" />
                Add Office Branch
              </h3>
              <button
                type="button"
                onClick={() => setIsAddBranchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddBranch} className="flex flex-col min-h-0 flex-1">
              <CardContent className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                {/* Office Location Map Trigger */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Office Location
                  </label>
                  {newBranchLatitude && newBranchLongitude ? (
                    <div className="rounded-2xl border border-border p-4 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-primary animate-bounce" />
                          Location pinned
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setTempLat(newBranchLatitude);
                            setTempLng(newBranchLongitude);
                            setTempAddress(newBranchAddress);
                            setTempCity(newBranchCity);
                            setTempState(newBranchState);
                            setTempPincode(newBranchPincode);
                            setIsMapModalOpen(true);
                          }}
                          className="h-8 text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                        >
                          Change
                        </Button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed text-left">
                        {newBranchAddress}
                      </p>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-left">
                        Coordinates: {newBranchLatitude.toFixed(6)}, {newBranchLongitude.toFixed(6)}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTempLat(19.0760);
                        setTempLng(72.8777);
                        setTempAddress("");
                        setTempCity("");
                        setTempState("");
                        setTempPincode("");
                        setIsMapModalOpen(true);
                      }}
                      className="w-full h-24 rounded-2xl border-2 border-dashed border-border/70 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col items-center justify-center gap-2 hover:border-primary/45 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all cursor-pointer text-slate-500 hover:text-primary"
                    >
                      <MapPin className="h-6 w-6 text-slate-400 hover:text-primary transition-colors" />
                      <span className="text-xs font-bold uppercase tracking-wider">Choose Location on Map</span>
                    </button>
                  )}
                </div>

                {/* Pincode */}
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

                {/* Allow WFH Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-slate-50/20 dark:bg-slate-900/10">
                  <div className="space-y-0.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Allow Work From Home (WFH)
                    </label>
                    <span className="block text-[9px] text-slate-400">
                      Enable or disable WFH applications for this office branch
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newBranchAllowWFH}
                      onChange={(e) => setNewBranchAllowWFH(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-850 peer-focus:outline-none rounded-full peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </CardContent>

              <div className="px-6 py-4 border-t border-border/40 flex flex-col gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex justify-end gap-3 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddBranchModalOpen(false)}
                    className="text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={branchLoading || !newBranchName.trim() || !newBranchAddress.trim() || !selectedMapLocation}
                    className="btn-primary text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
                  >
                    {branchLoading ? "Saving..." : "Add Office Branch"}
                  </Button>
                </div>
                {!selectedMapLocation && (
                  <p className="text-[10px] text-slate-400 text-center w-full font-medium">
                    * Pin location on map before saving branch.
                  </p>
                )}
              </div>
            </form>
          </Card>
        </div>
      )}

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

      {/* Map Modal */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <Card className="crm-card max-w-3xl w-full bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-primary" />
                Pin exact office location
              </h3>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <CardContent className="p-6 flex-1 flex flex-col overflow-y-auto space-y-4 min-h-0">
              {/* Search Bar inside Modal */}
              <div className="relative z-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleModalSearch())}
                    placeholder="Search building, road, area, or landmark"
                    className="block w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs outline-none focus:border-primary/45"
                  />
                  <Button
                    type="button"
                    onClick={handleModalSearch}
                    disabled={modalSearchLoading || !modalSearchQuery.trim()}
                    className="h-9 px-4 text-[10px] font-bold uppercase tracking-wider shrink-0"
                  >
                    {modalSearchLoading ? "Searching" : "Search"}
                  </Button>
                </div>
                
                {modalSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1.5 w-full rounded-xl border border-border bg-card shadow-xl backdrop-blur-md overflow-hidden max-h-48 overflow-y-auto p-1.5 space-y-0.5 z-[1001]">
                    {modalSearchResults.map((result, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectModalSearchResult(result)}
                        className="w-full text-left rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-155 dark:hover:bg-slate-800 transition-colors font-medium truncate cursor-pointer"
                      >
                        {result.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Map Container */}
              <div className="relative border border-border/85 rounded-2xl overflow-hidden h-[380px] bg-slate-100 dark:bg-slate-950 shrink-0">
                <div id="leaflet-modal-map" className="h-full w-full z-0" />
                <div className="absolute top-3 right-3 z-[1000] bg-background/95 backdrop-blur-sm border border-border px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider text-slate-500 shadow-md">
                  Click map or drag marker to pin
                </div>
              </div>

              {/* Location Details Preview */}
              <div className="rounded-xl border border-border/50 bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-2 text-xs">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Address Details (Auto-filled)
                </span>
                {tempAddress ? (
                  <p className="font-semibold text-slate-700 dark:text-slate-350 leading-relaxed text-left">
                    {tempAddress}
                  </p>
                ) : (
                  <p className="text-slate-405 italic text-left">No location pinned yet. Drag marker or search to select.</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-[10px] border-t border-border/10">
                  <div className="text-left">
                    <span className="block text-slate-400 uppercase font-medium">City</span>
                    <span className="font-bold">{tempCity || "—"}</span>
                  </div>
                  <div className="text-left">
                    <span className="block text-slate-400 uppercase font-medium">State</span>
                    <span className="font-bold">{tempState || "—"}</span>
                  </div>
                  <div className="text-left">
                    <span className="block text-slate-400 uppercase font-medium">Pin Code</span>
                    <span className="font-bold">{tempPincode || "—"}</span>
                  </div>
                  <div className="text-left">
                    <span className="block text-slate-400 uppercase font-medium">Coordinates</span>
                    <span className="font-bold">{tempLat.toFixed(6)}, {tempLng.toFixed(6)}</span>
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMapModalOpen(false)}
                className="text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setNewBranchLatitude(tempLat);
                  setNewBranchLongitude(tempLng);
                  setNewBranchAddress(tempAddress);
                  setNewBranchCity(tempCity);
                  setNewBranchState(tempState);
                  setNewBranchPincode(tempPincode);
                  setSelectedMapLocation({
                    id: `confirmed-${Date.now()}`,
                    label: tempAddress,
                    lat: tempLat,
                    lon: tempLng,
                    city: tempCity,
                    state: tempState,
                    pincode: tempPincode,
                  });
                  setIsMapModalOpen(false);
                }}
                disabled={!tempAddress}
                className="btn-primary text-xs font-bold uppercase tracking-wider !h-9 rounded-xl cursor-pointer"
              >
                Confirm Location
              </Button>
            </div>
          </Card>
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
