"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, ArrowLeft, Sparkles, Briefcase, Shield, User, CheckCircle2, Circle, Building, Building2, MapPin, Users, Factory } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function OnboardingPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [customDepartment, setCustomDepartment] = useState("");
  const [role, setRole] = useState("Employee");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [employeeCount, setEmployeeCount] = useState("1-10");
  // Extended company profile
  const [industry, setIndustry] = useState("");
  const [companyPincode, setCompanyPincode] = useState("");
  const [companyPincodeLoading, setCompanyPincodeLoading] = useState(false);
  // Initial branch (Main HQ - auto-registered)
  const [branchAddress, setBranchAddress] = useState("");
  const [branchPincode, setBranchPincode] = useState("");
  const [branchPincodeLoading, setBranchPincodeLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState(1);
  const [isInvited, setIsInvited] = useState(false);

  useEffect(() => {
    // If user is invited, skip Step 3 (Workspace Setup)
    if (step === 3 && isInvited) {
      setStep(2);
    }
  }, [step, isInvited]);

  useEffect(() => {
    // Confirm they are authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        // Double check if employee profile already exists
        const token = session.access_token;
        try {
          const res = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();
          if (data.employee) {
            // Already onboarded, redirect to dashboard
            router.push("/dashboard");
            return;
          }
          if (data.isInvited) {
            setIsInvited(true);
          }
        } catch (err) {
          console.error(err);
        }

        // Prefill name from Supabase user signup metadata
        const metadataName = session.user?.user_metadata?.full_name || session.user?.user_metadata?.name || "";
        setName(metadataName);
        setCheckingSession(false);
      }
    };
    checkAuth();
  }, [router]);

  // Company address pincode autofill
  useEffect(() => {
    if (companyPincode.length === 6 && /^\d+$/.test(companyPincode)) {
      const fetchLocation = async () => {
        setCompanyPincodeLoading(true);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${companyPincode}`);
          if (res.ok) {
            const data = await res.json();
            if (data[0] && data[0].Status === "Success" && data[0].PostOffice?.[0]) {
              const po = data[0].PostOffice[0];
              const city = po.District || po.Division || "";
              const state = po.State || "";
              setCompanyAddress(`${po.Name ? po.Name + ", " : ""}${city}, ${state} - ${companyPincode}`);
            }
          }
        } catch (err) {
          console.error("Company pincode lookup error:", err);
        } finally {
          setCompanyPincodeLoading(false);
        }
      };
      fetchLocation();
    }
  }, [companyPincode]);

  // Branch address pincode autofill
  useEffect(() => {
    if (branchPincode.length === 6 && /^\d+$/.test(branchPincode)) {
      const fetchLocation = async () => {
        setBranchPincodeLoading(true);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${branchPincode}`);
          if (res.ok) {
            const data = await res.json();
            if (data[0] && data[0].Status === "Success" && data[0].PostOffice?.[0]) {
              const po = data[0].PostOffice[0];
              const city = po.District || po.Division || "";
              const state = po.State || "";
              setBranchAddress(`${po.Name ? po.Name + ", " : ""}${city}, ${state} - ${branchPincode}`);
            }
          }
        } catch (err) {
          console.error("Branch pincode lookup error:", err);
        } finally {
          setBranchPincodeLoading(false);
        }
      };
      fetchLocation();
    }
  }, [branchPincode]);

  const handleNextStep1 = (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!phoneNumber) {
      setErrorMsg("Please enter your phone number.");
      return;
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }
    if (department === "Other" && !customDepartment.trim()) {
      setErrorMsg("Please enter your department name.");
      return;
    }
    setStep(2);
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      setStep(1);
      return;
    }

    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      setErrorMsg("Please enter a valid phone number.");
      setStep(1);
      return;
    }

    if (department === "Other" && !customDepartment.trim()) {
      setErrorMsg("Please enter your department name.");
      setStep(1);
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2 && !isInvited) {
      setStep(3);
      return;
    }

    if (!isInvited) {
      if (!companyName.trim()) {
        setErrorMsg("Please enter your company name.");
        return;
      }
      if (!companyAddress.trim()) {
        setErrorMsg("Please enter your company address.");
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg("Your session has expired. Please log in again.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: phoneNumber,
          department: department === "Other" ? customDepartment.trim() : department,
          role,
          companyName: !isInvited ? companyName.trim() : null,
          companyAddress: !isInvited ? companyAddress.trim() : null,
          employeeCount: !isInvited ? employeeCount : null,
          industry: !isInvited ? industry.trim() : null,
          initialBranch: !isInvited
            ? {
                name: "Main HQ",
                address: branchAddress.trim() || companyAddress.trim(),
                allowWFH: true,
              }
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to save profile.");
        setLoading(false);
        return;
      }

      // Store credentials and redirect
      sessionStorage.setItem("ansh_auth_session", "true");
      sessionStorage.setItem("ansh_auth_token", session.access_token);
      
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Validating secure session...
          </span>
        </div>
      </div>
    );
  }

  const getStepHeader = () => {
    switch (step) {
      case 1:
        return {
          title: "Personal Profile",
          desc: "Verify your pre-filled name and select your department registry."
        };
      case 2:
        return {
          title: "Account Permission",
          desc: "Assign an account permission role to determine your workspace privileges."
        };
      case 3:
        return {
          title: "Workspace Details",
          desc: "Set up company name, scale size, and address for your organization workspace."
        };
      default:
        return {
          title: "Workspace Settings",
          desc: "Set up your profile details, department registry, and workspace role."
        };
    }
  };

  const header = getStepHeader();

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden select-none">
      
      {/* LEFT PANE - Progress Steps Timeline */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#070809] lg:flex border-r border-white/5 p-16 xl:p-20 min-h-screen">
        {/* Dynamic mesh glow background */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute -left-20 top-1/4 h-[350px] w-[350px] rounded-full bg-emerald-500/10 blur-[130px] opacity-30" />
          <div className="absolute -right-20 bottom-1/4 h-[300px] w-[300px] rounded-full bg-sky-500/10 blur-[120px] opacity-20" />
        </div>

        {/* Branding */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 border border-white/10">
            <img
              src="/logoAnshapps.png"
              alt="Ansh Apps Logo"
              className="h-8.5 w-8.5 object-contain"
            />
          </div>
          <div>
            <span className="font-extrabold text-xs tracking-wider uppercase text-white block">
              Ansh HR
            </span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block -mt-0.5">
              Workspace Onboarding
            </span>
          </div>
        </div>

        {/* Steps Stepper */}
        <div className="relative z-10 space-y-12 my-auto max-w-md">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white leading-tight">
              Let's complete your{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                Workspace Profile
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              Set up your profile details, choose your department role, and customize company workspace details.
            </p>
          </div>

          <div className="space-y-8 relative pl-2">
            {/* Visual connector line */}
            <div className="absolute left-[19px] top-3 bottom-3 w-[2px] bg-slate-800" />

            {/* STEP 1 */}
            <div className={`flex gap-4 relative transition-all duration-300 ${step < 1 ? "opacity-50" : ""}`}>
              {step > 1 ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 className="h-5.5 w-5.5" />
                </div>
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                  <span className="text-xs font-black">01</span>
                </div>
              )}
              <div className="space-y-1 pt-0.5">
                <h3 className={`text-sm font-bold ${step === 1 ? "text-sky-400" : "text-white"}`}>Step 1: Personal Profile</h3>
                <p className={`text-xs leading-relaxed ${step === 1 ? "text-slate-350" : "text-slate-500"}`}>
                  Tell us your full name and select your department registry.
                </p>
              </div>
            </div>

            {/* STEP 2 */}
            <div className={`flex gap-4 relative transition-all duration-300 ${step < 2 ? "opacity-50" : ""}`}>
              {step > 2 ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 className="h-5.5 w-5.5" />
                </div>
              ) : step === 2 ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                  <span className="text-xs font-black">02</span>
                </div>
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 border border-white/5 text-slate-500">
                  <Circle className="h-4.5 w-4.5" />
                </div>
              )}
              <div className="space-y-1 pt-0.5">
                <h3 className={`text-sm font-bold ${step === 2 ? "text-sky-400" : step > 2 ? "text-white" : "text-slate-400"}`}>Step 2: Access Permission</h3>
                <p className={`text-xs leading-relaxed ${step === 2 ? "text-slate-350" : "text-slate-500"}`}>
                  Assign your role layout. Choose Employee to view/log or administrative for workspace setup.
                </p>
              </div>
            </div>

            {/* STEP 3 */}
            <div className={`flex gap-4 relative transition-all duration-300 ${step < 3 ? "opacity-50" : ""}`}>
              {step === 3 ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                  <span className="text-xs font-black">03</span>
                </div>
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 border border-white/5 text-slate-500">
                  <Circle className="h-4.5 w-4.5" />
                </div>
              )}
              <div className="space-y-1 pt-0.5">
                <h3 className={`text-sm font-bold ${step === 3 ? "text-sky-400" : "text-slate-400"}`}>
                  {isInvited ? "Step 3: Ready to Launch" : "Step 3: Workspace Setup"}
                </h3>
                <p className={`text-xs leading-relaxed ${step === 3 ? "text-slate-350" : "text-slate-500"}`}>
                  {isInvited
                    ? "Complete profile registration and initialize your leave accounts."
                    : "Configure company details, team size, and registered physical address."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[10px] font-semibold text-slate-500">
          © 2026 ANSH HR. Crafted for modern workspace teams.
        </div>
      </div>

      {/* RIGHT PANE - Form Input Panel */}
      <div className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2 select-none overflow-y-auto min-h-screen">
        <div className="w-full max-w-[420px] space-y-8 py-8 animate-in fade-in duration-500">
          
          {/* Header Description */}
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden flex justify-center">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="h-5.5 w-5.5" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {header.title}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {header.desc}
            </p>
          </div>

          {/* Form Message Alerts */}
          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-600 animate-in fade-in duration-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
                {/* FULL NAME */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Full Name
                  </label>
                  <div className="mt-2 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="block w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/40"
                    />
                  </div>
                  <p className="mt-1.5 text-[9px] text-slate-400">
                    * Pre-filled from your signup form. You can adjust it here if needed.
                  </p>
                </div>

                {/* PHONE NUMBER */}
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

                {/* DEPARTMENT */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Department Registry
                  </label>
                  <div className="mt-2 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="h-4.5 w-4.5" />
                    </div>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="block w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/40 appearance-none cursor-pointer"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Product Design">Product Design</option>
                      <option value="Data Analytics">Data Analytics</option>
                      <option value="Executive">Executive</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* CUSTOM DEPARTMENT (shown when "Other" is selected) */}
                  {department === "Other" && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <input
                        type="text"
                        value={customDepartment}
                        onChange={(e) => setCustomDepartment(e.target.value)}
                        placeholder="Enter your department name"
                        className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/40"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleNextStep1}
                    className="flex w-full justify-center items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/10 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/25 active:scale-[0.98] cursor-pointer"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Role Selector */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
                {/* ROLE SELECTOR */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Account Permission Role
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: "Employee", label: "Employee", desc: "View & log time" },
                      { value: "HR Manager", label: "HR Manager", desc: "Approve leaves" },
                      { value: "Admin", label: "Admin", desc: "Full permissions" },
                      { value: "Owner", label: "Owner", desc: "Full access & billing" }
                    ].map((item) => {
                      const active = role === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setRole(item.value)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                            active
                              ? "bg-emerald-50 border-emerald-500/50 text-emerald-600"
                              : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          <Shield className={`h-4.5 w-4.5 mb-1.5 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                          <span className="text-xs font-bold block">{item.label}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5 leading-none">{item.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[9px] text-slate-400 leading-normal">
                    * Account role sets your workspace privileges level. HR Manager & Admins gain access to approvals, settings, and company configurations.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex flex-1 justify-center items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-[2] justify-center items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/10 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Completing Setup...
                      </>
                    ) : !isInvited ? (
                      <>
                        Next: Company Setup
                        <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Company Setup */}
            {step === 3 && !isInvited && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sky-600 border-b border-sky-200 pb-2">
                    <Building className="h-4.5 w-4.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Company Workspace Setup</span>
                  </div>

                  {/* COMPANY NAME */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Company Name
                    </label>
                    <div className="mt-1.5 relative">
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. ANSH Solutions"
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40"
                      />
                    </div>
                  </div>

                  {/* EMPLOYEES COUNT */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Company Employee Size
                    </label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <select
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-xs text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 appearance-none cursor-pointer"
                      >
                        <option value="1-10">1 - 10 employees</option>
                        <option value="11-50">11 - 50 employees</option>
                        <option value="51-200">51 - 200 employees</option>
                        <option value="200+">200+ employees</option>
                      </select>
                    </div>
                  </div>

                  {/* COMPANY ADDRESS */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Company Pincode
                        {companyPincodeLoading && (
                          <span className="ml-2 text-sky-500 normal-case font-normal">Looking up...</span>
                        )}
                      </label>
                      <div className="mt-1.5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <MapPin className="h-3.5 w-3.5" />
                        </div>
                        <input
                          type="text"
                          value={companyPincode}
                          onChange={(e) => setCompanyPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="Enter 6-digit pincode to auto-fill address"
                          maxLength={6}
                          className="block w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Company Address
                        {companyAddress && companyPincode.length === 6 && (
                          <span className="ml-2 text-sky-500 normal-case font-normal">✓ Auto-filled</span>
                        )}
                      </label>
                      <div className="mt-1.5 relative">
                        <div className="absolute top-3 left-3 text-slate-400">
                          <MapPin className="h-3.5 w-3.5" />
                        </div>
                        <textarea
                          required
                          rows={2}
                          value={companyAddress}
                          onChange={(e) => setCompanyAddress(e.target.value)}
                          placeholder="Auto-fills from pincode, or type your full address"
                          className="block w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                  {/* INDUSTRY TYPE */}
                  <div className="border-t border-sky-200 pt-3">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Industry Type <span className="text-slate-400 font-normal normal-case">(optional)</span>
                    </label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Factory className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type="text"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="e.g. Software & Technology"
                        className="block w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40"
                      />
                    </div>
                  </div>
                </div>

                {/* MAIN HQ BRANCH */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 border-b border-emerald-200 pb-2">
                    <Building2 className="h-4.5 w-4.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Main HQ Branch</span>
                    <span className="ml-auto text-[9px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Auto-registered
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed">
                    Your primary HQ branch will be created automatically. Enter the branch pincode to auto-fill its address, or leave blank to use the company address.
                  </p>

                  {/* BRANCH PINCODE */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Branch Pincode
                      {branchPincodeLoading && (
                        <span className="ml-2 text-emerald-500 normal-case font-normal">Looking up...</span>
                      )}
                    </label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type="text"
                        value={branchPincode}
                        onChange={(e) => setBranchPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="e.g. 110001"
                        maxLength={6}
                        className="block w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                      />
                    </div>
                  </div>

                  {/* BRANCH ADDRESS (auto-filled) */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Branch Address
                      {branchAddress && (
                        <span className="ml-2 text-emerald-500 normal-case font-normal">✓ Auto-filled</span>
                      )}
                    </label>
                    <div className="mt-1.5 relative">
                      <div className="absolute top-3 left-3 text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <textarea
                        rows={2}
                        value={branchAddress}
                        onChange={(e) => setBranchAddress(e.target.value)}
                        placeholder="Auto-fills from pincode, or leave blank to use company address"
                        className="block w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex flex-1 justify-center items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-[2] justify-center items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/10 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Completing Setup...
                      </>
                    ) : (
                      <>
                        Complete Workspace Setup
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
