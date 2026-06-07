"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, ArrowLeft, Sparkles, Briefcase, Shield, User, CheckCircle2, Circle, Calendar, Building, MapPin, Users } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [role, setRole] = useState("Employee");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [employeeCount, setEmployeeCount] = useState("1-10");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState(1);

  const isManagerOrAdmin = role === "Admin" || role === "HR Manager" || role === "Owner";

  useEffect(() => {
    // If role is employee, ensure we don't end up on step 3
    if (step === 3 && !isManagerOrAdmin) {
      setStep(2);
    }
  }, [step, isManagerOrAdmin]);

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

  const handleNextStep1 = (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
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

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2 && isManagerOrAdmin) {
      setStep(3);
      return;
    }

    if (isManagerOrAdmin) {
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
          department,
          role,
          companyName: isManagerOrAdmin ? companyName.trim() : null,
          companyAddress: isManagerOrAdmin ? companyAddress.trim() : null,
          employeeCount: isManagerOrAdmin ? employeeCount : null,
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
                  {role === "Employee" ? "Step 3: Ready to Launch" : "Step 3: Workspace Setup"}
                </h3>
                <p className={`text-xs leading-relaxed ${step === 3 ? "text-slate-350" : "text-slate-500"}`}>
                  {role === "Employee"
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
      <div className="flex w-full items-center justify-center bg-slate-950 px-6 py-12 lg:w-1/2 select-none overflow-y-auto min-h-screen">
        <div className="w-full max-w-[420px] space-y-8 py-8 animate-in fade-in duration-500">
          
          {/* Header Description */}
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden flex justify-center">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="h-5.5 w-5.5" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {header.title}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {header.desc}
            </p>
          </div>

          {/* Form Message Alerts */}
          {errorMsg && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-bold text-rose-400 animate-in fade-in duration-200">
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
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="block w-full rounded-2xl border border-white/5 bg-slate-950/80 pl-11 pr-4 py-3.5 text-sm text-white shadow-inner outline-none transition-all placeholder:text-slate-650 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/40"
                    />
                  </div>
                  <p className="mt-1.5 text-[9px] text-slate-500">
                    * Pre-filled from your signup form. You can adjust it here if needed.
                  </p>
                </div>

                {/* DEPARTMENT */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Department Registry
                  </label>
                  <div className="mt-2 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Briefcase className="h-4.5 w-4.5" />
                    </div>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="block w-full rounded-2xl border border-white/5 bg-slate-950/80 pl-11 pr-4 py-3.5 text-sm text-white shadow-inner outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/40 appearance-none cursor-pointer"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Product Design">Product Design</option>
                      <option value="Data Analytics">Data Analytics</option>
                      <option value="Executive">Executive</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>
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
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                              : "bg-slate-950/50 border-white/5 text-slate-500 hover:bg-slate-950/80"
                          }`}
                        >
                          <Shield className={`h-4.5 w-4.5 mb-1.5 ${active ? "text-emerald-400" : "text-slate-600"}`} />
                          <span className="text-xs font-bold block">{item.label}</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5 leading-none">{item.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[9px] text-slate-500 leading-normal">
                    * Account role sets your workspace privileges level. HR Manager & Admins gain access to approvals, settings, and company configurations.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex flex-1 justify-center items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3.5 text-sm font-bold text-slate-300 transition-all hover:bg-slate-800 hover:text-white active:scale-[0.98] cursor-pointer"
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
                    ) : isManagerOrAdmin ? (
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

            {/* STEP 3: Company Setup (Managers/Admins only) */}
            {step === 3 && isManagerOrAdmin && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
                <div className="rounded-2xl border border-sky-500/10 bg-sky-500/5 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sky-400 border-b border-sky-500/10 pb-2">
                    <Building className="h-4.5 w-4.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Company Workspace Setup</span>
                  </div>

                  {/* COMPANY NAME */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Company Name
                    </label>
                    <div className="mt-1.5 relative">
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. ANSH Solutions"
                        className="block w-full rounded-xl border border-white/5 bg-slate-950/90 px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/40"
                      />
                    </div>
                  </div>

                  {/* EMPLOYEES COUNT */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Company Employee Size
                    </label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <select
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value)}
                        className="block w-full rounded-xl border border-white/5 bg-slate-950/90 pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/40 appearance-none cursor-pointer"
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
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Company Address
                    </label>
                    <div className="mt-1.5 relative">
                      <div className="absolute top-3 left-3 text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <textarea
                        required
                        rows={2}
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="e.g. 123 Business Park, Mumbai, India"
                        className="block w-full rounded-xl border border-white/5 bg-slate-950/90 pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/40 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex flex-1 justify-center items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3.5 text-sm font-bold text-slate-300 transition-all hover:bg-slate-800 hover:text-white active:scale-[0.98] cursor-pointer"
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
