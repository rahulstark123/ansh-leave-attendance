"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  CalendarDays,
  ShieldCheck,
  Users2,
  BarChart4,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Play,
  Layers,
  Fingerprint,
  Users,
  Search,
  Check,
  Lock,
  ChevronRight,
  HelpCircle,
  Camera,
  Trash2,
  Upload,
  Info,
  Megaphone,
  Bell
} from "lucide-react";

type MockTab = "punch" | "leaves" | "team";
type AccentTheme = "emerald" | "indigo" | "sapphire" | "graphite";

const ecosystemApps = [
  {
    name: "ANSH Booking",
    subtitle: "Meeting room & resource booking",
    description: "Reserve rooms, assets and slots with ease",
    status: "BUILDING",
    isLive: false,
    badgeText: "BUILDING",
    badgeColor: "bg-rose-500/10 text-rose-450 border-rose-500/25",
    dotColor: "bg-rose-500",
    borderColor: "hover:border-rose-500/35 hover:shadow-rose-500/5",
    link: "https://anshapps.com",
  },
  {
    name: "ANSH Visitor",
    subtitle: "Smart lobby & guest management",
    description: "QR passes, ID verification, check-in logs",
    status: "LIVE",
    isLive: true,
    badgeText: "LIVE",
    badgeColor: "bg-emerald-500/10 text-emerald-455 border-emerald-500/25",
    dotColor: "bg-emerald-500",
    borderColor: "hover:border-emerald-500/35 hover:shadow-emerald-500/5",
    image: "/ANSH Visitor.jpg",
    link: "https://visitor.anshapps.com",
  },
  {
    name: "ANSH Tasks",
    subtitle: "Team task & project tracker",
    description: "Assign, track and close tasks across teams",
    status: "LIVE",
    isLive: true,
    badgeText: "LIVE",
    badgeColor: "bg-sky-500/10 text-sky-450 border-sky-500/25",
    dotColor: "bg-sky-500",
    borderColor: "hover:border-sky-500/35 hover:shadow-sky-500/5",
    image: "/Ansh Task.jpg",
    link: "https://tasks.anshapps.com",
  },
  {
    name: "ANSH HR",
    subtitle: "Human resource management",
    description: "Employee records, leaves, payroll & more",
    status: "CURRENT",
    isLive: true,
    badgeText: "YOU ARE HERE",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse",
    dotColor: "bg-purple-500",
    borderColor: "border-purple-500/40 hover:border-purple-500/60 shadow-purple-500/5",
    image: "/ANSH HR.jpg",
    link: "https://hr.anshapps.com",
  },
  {
    name: "ANSH Expense",
    subtitle: "Expense & reimbursement tracking",
    description: "Submit, approve and audit business expenses",
    status: "LIVE",
    isLive: true,
    badgeText: "LIVE",
    badgeColor: "bg-amber-500/10 text-amber-450 border-amber-500/25",
    dotColor: "bg-amber-500",
    borderColor: "hover:border-amber-500/35 hover:shadow-amber-500/5",
    image: "/ANSH Expense.jpg",
    link: "https://expense.anshapps.com",
  },
];

export default function LandingPage() {
  const [sessionActive, setSessionActive] = useState(false);
  const [activeTab, setActiveTab] = useState<MockTab>("punch");
  const [activeAccent, setActiveAccent] = useState<AccentTheme>("emerald");
  const [mockTime, setMockTime] = useState("08:14:52");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem("ansh_auth_session");
    if (session === "true") {
      setSessionActive(true);
    }
  }, []);

  // Update ticking mock clock inside the interactive widget
  useEffect(() => {
    const interval = setInterval(() => {
      const date = new Date();
      const hrs = date.getHours().toString().padStart(2, "0");
      const mins = date.getMinutes().toString().padStart(2, "0");
      const secs = date.getSeconds().toString().padStart(2, "0");
      setMockTime(`${hrs}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Accent helper classes mapping
  const accentTextClass = {
    emerald: "text-emerald-400",
    indigo: "text-indigo-400",
    sapphire: "text-sky-400",
    graphite: "text-slate-300"
  }[activeAccent];

  const accentBgClass = {
    emerald: "bg-emerald-500",
    indigo: "bg-indigo-500",
    sapphire: "bg-sky-500",
    graphite: "bg-slate-500"
  }[activeAccent];

  const accentBadgeClass = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    sapphire: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    graphite: "bg-slate-500/10 text-slate-300 border-slate-500/20"
  }[activeAccent];

  const accentBorderClass = {
    emerald: "border-emerald-500/20 hover:border-emerald-500/40",
    indigo: "border-indigo-500/20 hover:border-indigo-500/40",
    sapphire: "border-sky-500/20 hover:border-sky-500/40",
    graphite: "border-slate-700 hover:border-slate-600"
  }[activeAccent];

  const accentGlowClass = {
    emerald: "shadow-emerald-500/20",
    indigo: "shadow-indigo-500/20",
    sapphire: "shadow-sky-500/20",
    graphite: "shadow-slate-500/20"
  }[activeAccent];

  return (
    <div className="min-h-screen bg-[#04080F] font-sans text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Symmetrical Background Glow Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[160px]" />
        <div className="absolute -right-1/4 top-1/4 h-[650px] w-[650px] rounded-full bg-sky-500/5 blur-[160px]" />
        <div className="absolute left-1/3 top-2/3 h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* 1. SYMMETRICAL NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-md bg-[#04080F]/85">
        <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 lg:px-12 xl:px-16 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logoAnshapps.png"
              alt="Ansh Apps Logo"
              className="h-9 w-9 object-contain"
            />
            <div>
              <span className="font-extrabold text-sm tracking-wider uppercase text-white block">
                ANSH HR
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#biometrics" className="hover:text-white transition-colors">Face Setup</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#comparison" className="hover:text-white transition-colors">Why ANSH</a>
          </nav>

          <div className="flex items-center gap-4">
            {sessionActive ? (
              <Link href="/dashboard">
                <button className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-500 px-5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  Go to Dashboard
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all cursor-pointer">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative z-10 mx-auto w-full max-w-[1720px] px-6 sm:px-8 lg:px-12 xl:px-16 pt-16 pb-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-7 text-left">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4.5 py-1.5 backdrop-blur-md">
              <Sparkles className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">
                Built for MSMEs & Scaling Teams
              </span>
            </div>

            <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-white">
              Run Your Entire HR, Leaves &{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
                Attendance
              </span>{" "}
              in One Workspace
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
              ANSH Leave & Attendance combines high-speed facial recognition check-ins, live ticking shift stopwatches, dynamic allowance requests, and role-guarded pipelines into a unified, high-performance portal.
            </p>

            {/* Benefit Checkmarks Grid (2x2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Biometric Face Verification</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Scan profiles client-side with zero network lag.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Live Ticking Shift Clock</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Watch active hours track down to the second.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Automatic Leave Deductions</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Real-time allowances (Annual, Sick, Casual).</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Role-Guarded Approvals</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Strict admin/manager approval dashboards.</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <button className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-2xl bg-emerald-500 px-8 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/15 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  Start your 14 days Free trial
                  <Play className="ml-2 h-4 w-4 fill-current" />
                </button>
              </Link>
              <a href="https://anshapps.com/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <button className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 text-sm font-bold text-slate-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
                  Visit ANSH
                </button>
              </a>
            </div>

            <div className="pt-6 border-t border-white/5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Built from Bharat for the World — encouraging{" "}
                <span className="text-emerald-400">Vasudhaiva Kutumbakam</span>
              </p>
            </div>
          </div>

          {/* Hero Right Mockup Frame (Toggles and Accent selection) */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-sky-500/10 rounded-3xl blur-2xl -z-10" />
            
            {/* Interactive Browser Frame */}
            <div className="rounded-3xl border border-slate-800 bg-[#0A1118]/90 shadow-2xl p-5 space-y-5 select-none relative overflow-hidden">
              {/* Browser Dot Controls */}
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                
                {/* Simulated URL */}
                <div className="text-[9px] text-slate-500 font-mono bg-slate-950/40 px-3 py-1 rounded-md border border-white/5">
                  ansh-hr.app/dashboard
                </div>

                <div className="w-9" />
              </div>

              {/* Sub-navigation tabs inside mockup */}
              <div className="flex gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
                {(["punch", "leaves", "team"] as MockTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      activeTab === tab
                        ? `${accentBgClass} text-slate-950 font-black shadow-md`
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab === "punch" ? "Punch Clock" : tab === "leaves" ? "Leaves Gallery" : "Team Status"}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT 1: PUNCH CLOCK */}
              {activeTab === "punch" && (
                <div className="space-y-4 py-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ATTENDANCE CLOCK</span>
                      <span className="text-xs font-semibold text-slate-400 block mt-0.5">Check-in Session</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${accentBadgeClass} px-2 py-0.5 rounded border`}>
                      On-Time Check
                    </span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800/60 rounded-2xl py-6 text-center space-y-1">
                    <span className="block text-4xl font-mono font-black text-white tracking-widest">
                      {mockTime}
                    </span>
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      Active Shift Hours
                    </span>
                  </div>

                  <button className={`w-full h-11 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer text-white shadow-lg ${accentGlowClass} ${accentBgClass} !text-slate-950 font-black hover:opacity-90`}>
                    Punch Out Shift
                  </button>
                </div>
              )}

              {/* TAB CONTENT 2: LEAVES GALLERY */}
              {activeTab === "leaves" && (
                <div className="space-y-4 py-1 animate-in fade-in duration-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ALLOWANCE POOLS</span>
                  
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 text-center">
                      <span className={`block text-xl font-black ${accentTextClass}`}>14</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 block">Annual</span>
                    </div>
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 text-center">
                      <span className="block text-xl font-black text-sky-400">7</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 block">Sick</span>
                    </div>
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 text-center">
                      <span className="block text-xl font-black text-purple-400">6</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 block">Casual</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/50 rounded-xl border border-slate-800/50 p-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="block font-bold text-slate-200">Dental checkup appointment</span>
                      <span className="block text-[9px] text-slate-500 mt-0.5">Sick Leave · 1 Day</span>
                    </div>
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-500/10">
                      Pending Review
                    </span>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 3: TEAM STATUS */}
              {activeTab === "team" && (
                <div className="space-y-2.5 py-1 animate-in fade-in duration-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      disabled
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-2 pl-9 pr-4 text-[10px] text-slate-400 outline-none"
                    />
                  </div>

                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    <div className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/50 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${accentBgClass} text-slate-950 font-black text-[10px]`}>
                          RR
                        </div>
                        <div>
                          <span className="block font-bold text-slate-200">Rahul Raj</span>
                          <span className="block text-[9px] text-slate-500">HR Manager</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                        Active
                      </span>
                    </div>

                    <div className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/50 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-slate-950 font-black text-[10px]">
                          AP
                        </div>
                        <div>
                          <span className="block font-bold text-slate-200">Amit Patel</span>
                          <span className="block text-[9px] text-slate-500">Senior Designer</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/10">
                        On Leave
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Accent/Color selector panel */}
              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Try live color picker:</span>
                
                <div className="flex gap-2.5">
                  {(["emerald", "indigo", "sapphire", "graphite"] as AccentTheme[]).map((theme) => {
                    const bgCircle = {
                      emerald: "bg-emerald-500",
                      indigo: "bg-indigo-500",
                      sapphire: "bg-sky-500",
                      graphite: "bg-slate-400"
                    }[theme];

                    return (
                      <button
                        key={theme}
                        onClick={() => setActiveAccent(theme)}
                        className={`h-4.5 w-4.5 rounded-full ${bgCircle} cursor-pointer transition-all hover:scale-125 ${
                          activeAccent === theme ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110" : "opacity-80"
                        }`}
                        title={`Switch to ${theme} accent`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 ECOSYSTEM SHOWCASE SECTION */}
      <section className="relative z-10 border-t border-white/5 bg-[#04080F] py-20 overflow-hidden">
        <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 lg:px-12 xl:px-16 space-y-12">
          {/* Header Row */}
          <div className="grid gap-6 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
                Ecosystem
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
                The full <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">Ansh Apps</span> suite
              </h2>
            </div>
            <div className="md:col-span-5">
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-medium">
                One ecosystem, every business operation — manage tasks, HR, expenses, bookings and visitors from connected apps.
              </p>
            </div>
          </div>

          {/* Marquee Wrapper with side fade-out gradients */}
          <div className="relative w-full overflow-hidden">
            {/* Inline styles to guarantee marquee rendering and scrolling */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes marqueeScroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .custom-marquee-container {
                display: flex;
                flex-wrap: nowrap;
                width: max-content;
                animation: marqueeScroll 35s linear infinite;
                will-change: transform;
              }
              .custom-marquee-container:hover {
                animation-play-state: paused;
              }
            `}} />
            
            {/* Fade overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#04080F] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#04080F] to-transparent z-10 pointer-events-none" />

            {/* Scrolling Marquee Container */}
            <div className="custom-marquee-container py-4 gap-6">
              {[...ecosystemApps, ...ecosystemApps].map((app, index) => (
                <a
                  key={`${app.name}-${index}`}
                  href={app.link}
                  target={app.link.startsWith("http") ? "_blank" : undefined}
                  rel={app.link.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={`group relative flex flex-col justify-between w-72 shrink-0 rounded-3xl border border-white/5 bg-[#070c14]/85 p-4 space-y-4 transition-all duration-300 ${app.borderColor} hover:-translate-y-1 cursor-pointer`}
                >
                  {/* Image/Placeholder container */}
                  {app.image ? (
                    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/5">
                      <img
                        src={app.image}
                        alt={app.name}
                        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      {/* Top right status badge */}
                      <div className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md flex items-center gap-1.5 ${app.badgeColor}`}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {app.badgeText}
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-purple-950/40 via-slate-950 to-pink-950/20 border border-white/5 flex flex-col items-center justify-center">
                      {/* Dashed circle icon */}
                      <div className="w-10 h-10 rounded-full border border-dashed border-pink-500/40 flex items-center justify-center animate-spin [animation-duration:15s]">
                        <div className="w-6 h-6 rounded-full border border-dashed border-pink-500/20" />
                      </div>
                      <span className="text-xs font-bold text-pink-400 uppercase tracking-widest mt-3">
                        In Development
                      </span>
                      {/* Top right status badge */}
                      <div className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md flex items-center gap-1.5 ${app.badgeColor}`}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {app.badgeText}
                      </div>
                    </div>
                  )}

                  {/* App Text and Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${app.dotColor}`} />
                        <h4 className="text-base font-bold text-slate-100">{app.name}</h4>
                      </div>
                      {/* Status pill button */}
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                        app.status === "BUILDING"
                          ? "border-rose-500/30 text-rose-450 bg-rose-500/5"
                          : app.name === "ANSH HR"
                            ? "border-purple-500/40 text-purple-400 bg-purple-500/10"
                            : "border-emerald-500/30 text-emerald-455 bg-emerald-500/5"
                      }`}>
                        {app.status === "BUILDING" ? "Soon" : "Live"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-200">{app.subtitle}</p>
                      <p className="text-xs text-slate-450 font-medium leading-relaxed">{app.description}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURES GRID ("Streamline Your Entire HR Operations Natively") */}
      <section id="features" className="relative z-10 border-t border-white/5 bg-[#03060C]/60 py-24">
        <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 lg:px-12 xl:px-16 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Streamline Your Entire HR Operations Natively
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              No need to pay for multiple software tools. ANSH HR consolidates your attendance registers, facial scans, allowances, and employee directories under one affordable platform.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0A1016]/40 p-6 space-y-4 hover:border-emerald-500/25 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <Fingerprint className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Facial Recognition Punch-In</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Process facial landmark coordinates client-side with face-api.js. Provides secure authentication with zero server processing latency.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0A1016]/40 p-6 space-y-4 hover:border-emerald-500/25 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Live Stopwatch Clocking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A live stopwatch tracks your check-in length down to the second in the dashboard, with built-in tolerance rules for grace check-ins.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0A1016]/40 p-6 space-y-4 hover:border-emerald-500/25 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <CalendarDays className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Dynamic Allowance Pools</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Employees can request Annual, Sick, or Casual leaves through dialog forms. Remaining balances automatically update on approval.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0A1016]/40 p-6 space-y-4 hover:border-emerald-500/25 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Glassmorphic Approvals Queue</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A dedicated request pipeline for HR Managers and Admins to accept/deny requests, complete with automatic employee balance updates.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0A1016]/40 p-6 space-y-4 hover:border-emerald-500/25 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <Users2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Team Status Registry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visual directory showcasing active employee counts. Search, filter by department, and review individual statuses in real-time.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0A1016]/40 p-6 space-y-4 hover:border-emerald-500/25 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Accent Theme Customization</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dynamic theme switcher. Swap the primary color theme instantly between Indigo, Sapphire, Emerald, and Graphite system styles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DETAILED BIOMETRIC SETUP FEATURE SECTION */}
      <section id="biometrics" className="relative z-10 mx-auto w-full max-w-[1720px] px-6 sm:px-8 lg:px-12 xl:px-16 py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Biometrics Setup Mockup */}
          <div className="relative rounded-3xl border border-slate-800 bg-[#0A1118]/85 p-6 shadow-2xl backdrop-blur-md overflow-hidden">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-5">
              Secure Enrollment Console
            </span>
            
            <div className="grid grid-cols-3 gap-3">
              {/* Slot 1: Front */}
              <div className="space-y-1.5 text-center">
                <div className="aspect-[4/3] rounded-xl border border-slate-700 bg-slate-900/60 flex flex-col items-center justify-center relative shadow-sm overflow-hidden p-1">
                  <div className="absolute inset-0 bg-emerald-500/5" />
                  <Camera className="h-5 w-5 text-emerald-400" />
                  <span className="text-[8px] font-semibold text-slate-400 mt-1 block">Front view</span>
                  <div className="absolute bottom-2 right-2 bg-emerald-500 text-slate-950 p-0.5 rounded-full">
                    <Check className="h-2 w-2" strokeWidth={4} />
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Front Profile</span>
              </div>

              {/* Slot 2: Left */}
              <div className="space-y-1.5 text-center">
                <div className="aspect-[4/3] rounded-xl border border-slate-700 bg-slate-900/60 flex flex-col items-center justify-center relative shadow-sm overflow-hidden p-1">
                  <div className="absolute inset-0 bg-emerald-500/5" />
                  <Camera className="h-5 w-5 text-emerald-400" />
                  <span className="text-[8px] font-semibold text-slate-400 mt-1 block">Left angle</span>
                  <div className="absolute bottom-2 right-2 bg-emerald-500 text-slate-950 p-0.5 rounded-full">
                    <Check className="h-2 w-2" strokeWidth={4} />
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Left Angle</span>
              </div>

              {/* Slot 3: Right */}
              <div className="space-y-1.5 text-center">
                <div className="aspect-[4/3] rounded-xl border border-slate-700 bg-slate-900/60 flex flex-col items-center justify-center relative shadow-sm overflow-hidden p-1">
                  <div className="absolute inset-0 bg-emerald-500/5" />
                  <Camera className="h-5 w-5 text-emerald-400" />
                  <span className="text-[8px] font-semibold text-slate-400 mt-1 block">Right angle</span>
                  <div className="absolute bottom-2 right-2 bg-emerald-500 text-slate-950 p-0.5 rounded-full">
                    <Check className="h-2 w-2" strokeWidth={4} />
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Right Angle</span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Info className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Client-Side Face Validation</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Images are temporarily drawn onto canvas to compute landmark embeddings via tinyFaceDetector model. Original files are resized to 800px and stored in Supabase S3.
              </p>
            </div>
          </div>

          {/* Biometrics Setup Description */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20 text-emerald-400">
              <Fingerprint className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Fast Setup</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Enroll Face Signatures in 3 Quick Photo Uploads
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              We process face parameters directly in the user's browser, extract a 128-float mathematical model, and store optimized files. This speeds up daily punch-ins and avoids webcam delays.
            </p>
            <ul className="space-y-3.5 text-xs text-slate-350 font-semibold">
              <li className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <span>Requires 3 reference images (Front, Left Profile, Right Profile)</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <span>Automatic client-side downscaling to 800px for speedy uploads</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <span>Clears database signatures instantly upon scan deletions</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4.5. LIVE ACTIVITY FEED & ANNOUNCEMENTS SECTION */}
      <section id="announcements" className="relative z-10 border-t border-white/5 bg-[#03060C]/60 py-24">
        <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 lg:px-12 xl:px-16 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Live Activity Feed & Broadcast Announcements
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Keep your entire workforce synchronized with dynamic organization-wide events and corporate bulletins. Build trust and alignment through real-time communication.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
            
            {/* Column 1: Live Activity Feed */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-[#0A1016]/40 p-8 space-y-6 hover:border-emerald-500/25 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Real-Time Updates</span>
                    <h3 className="text-lg font-bold text-slate-200">Organization Activity Logs</h3>
                  </div>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed">
                  Watch shift check-ins, leave requests, and status changes propagate across your team directory instantly.
                </p>

                <div className="space-y-3 pt-2">
                  {/* Event 1 */}
                  <div className="flex gap-3 items-start p-3 bg-slate-950/60 border border-slate-800/60 rounded-2xl hover:border-emerald-500/20 transition-all">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-black">
                      RR
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-200">Rahul Raj</span>
                        <span className="text-[9px] text-slate-500 font-mono">09:02 AM</span>
                      </div>
                      <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">Punched in at Mumbai Office (Selfie verified)</p>
                    </div>
                  </div>

                  {/* Event 2 */}
                  <div className="flex gap-3 items-start p-3 bg-slate-950/60 border border-slate-800/60 rounded-2xl hover:border-sky-500/20 transition-all">
                    <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 text-xs font-black">
                      AP
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-200">Amit Patel</span>
                        <span className="text-[9px] text-slate-500 font-mono">Yesterday</span>
                      </div>
                      <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">Requested 1-day Sick Leave (Awaiting HR Review)</p>
                    </div>
                  </div>

                  {/* Event 3 */}
                  <div className="flex gap-3 items-start p-3 bg-slate-950/60 border border-slate-800/60 rounded-2xl hover:border-purple-500/20 transition-all">
                    <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 text-xs font-black">
                      SYS
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-200">System Accrual</span>
                        <span className="text-[9px] text-slate-500 font-mono">1st Jun</span>
                      </div>
                      <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">Credited monthly leave allowances (+1.5 Annual Days)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Pinned Announcements */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-[#0A1016]/40 p-8 space-y-6 hover:border-emerald-500/25 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:bg-sky-500/20 transition-colors">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block">Notice Board</span>
                    <h3 className="text-lg font-bold text-slate-200">Active Announcements</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Pin company-wide notices for holiday updates, policy changes, office announcements, or safety guidelines.
                </p>

                <div className="space-y-3.5 pt-2">
                  {/* Announcement 1 */}
                  <div className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-2xl relative overflow-hidden group hover:border-sky-500/25 transition-all">
                    <div className="absolute top-0 right-0 bg-sky-500/10 text-sky-400 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl-xl border-l border-b border-sky-500/15">
                      Important
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <Bell className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                      <span>Q3 General Strategy Meeting</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                      All employees are requested to attend the Q3 townhall town hall session scheduled for Friday, June 19th at 3:00 PM IST.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2.5 text-[9px] text-slate-500 font-semibold">
                      <span>HR Department</span>
                      <span>·</span>
                      <span>2 hours ago</span>
                    </div>
                  </div>

                  {/* Announcement 2 */}
                  <div className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-2xl relative overflow-hidden group hover:border-emerald-500/25 transition-all">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <CalendarDays className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Independence Day Holiday Calendar</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                      Please note that August 15th will be observed as a national holiday across all registered branch offices.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2.5 text-[9px] text-slate-500 font-semibold">
                      <span>HR Department</span>
                      <span>·</span>
                      <span>2 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. FLEXIBLE PRICING SECTION */}
      <section id="pricing" className="relative z-10 border-t border-white/5 bg-[#03060C]/60 py-24">
        <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 lg:px-12 xl:px-16 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">
              <span className="text-[9px] font-bold tracking-widest uppercase text-emerald-400">Flexible Pricing</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Flexible Plans Tailored for Your Scale
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Start with core leave and attendance for free. Compare what each plan includes — you can manage billing inside your workspace when you are ready.
            </p>
          </div>

          <div className="grid gap-6 max-w-5xl mx-auto sm:grid-cols-2">
            {/* Free Plan */}
            <div className="rounded-3xl border border-slate-800 bg-[#070D14] p-8 flex flex-col justify-between space-y-6 relative hover:border-emerald-500/20 transition-all">
              <div className="space-y-4">
                <div className="inline-flex rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  For Micro Teams
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Free Plan</h3>
                  <p className="text-[10px] text-slate-500 leading-normal">Ideal for small business founders getting started.</p>
                </div>
                <div className="flex items-baseline text-white">
                  <span className="text-3xl font-black tracking-tight">₹0</span>
                  <span className="ml-1 text-[11px] font-semibold text-slate-500">/ workspace</span>
                </div>
                <ul className="space-y-3.5 pt-4 text-xs font-medium text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={3} />
                    <span>Up to 3 teammates</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={3} />
                    <span>50 punch-ins per month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={3} />
                    <span>Punch in/out attendance tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={3} />
                    <span>Default annual, sick, and casual leave</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={3} />
                    <span>Basic leave requests and approvals</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={3} />
                    <span>Employee directory and leave balances</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="rounded-3xl border border-emerald-500/25 bg-[#070D14] p-8 flex flex-col justify-between space-y-6 relative hover:border-emerald-500/40 transition-all shadow-xl shadow-emerald-950/20">
              <div className="space-y-4">
                <div className="inline-flex rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                  Best for MSMEs
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Pro Plan</h3>
                  <p className="text-[10px] text-slate-500 leading-normal">Per-user pricing that scales with every teammate you add.</p>
                </div>
                <div className="flex items-baseline text-white">
                  <span className="text-3xl font-black tracking-tight">₹199</span>
                  <span className="ml-1 text-[11px] font-semibold text-slate-500">/ user / month</span>
                </div>
                <ul className="space-y-3.5 pt-4 text-xs font-medium text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={3} />
                    <span>Per-user pricing — scales with your team size</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={3} />
                    <span>Unlimited punch-ins</span>
                  </li>

                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={3} />
                    <span>Shift roster manager with custom timings</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={3} />
                    <span>Custom leave categories and rules</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={3} />
                    <span>Company holiday calendar by branch</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={3} />
                    <span>Policy document hub and handbook uploads</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={3} />
                    <span>Team analytics, punctuality, and reports</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMPARISON MATRIX ("Why teams choose ANSH HR over legacy biometric systems") */}
      <section id="comparison" className="relative z-10 mx-auto w-full max-w-[1720px] px-6 sm:px-8 lg:px-12 xl:px-16 py-24 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-sky-500/25 bg-sky-500/5 px-4.5 py-1.5">
            <span className="text-[10px] font-bold tracking-widest uppercase text-sky-400">
              Why Teams Switch
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Why MSMEs choose ANSH HR over Zoho, biometric machines, and manual registers
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            We are built specifically for small & medium businesses that want real work execution, cleaner dashboard views, and zero setup friction.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-2xl border border-slate-800 bg-[#0A1016]/40 p-6 space-y-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">Compared to Biometric Hardware</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No expensive thumb-scanners or physical wall installations required. Staff check-in from their own screens with secure camera feeds.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-slate-800 bg-[#0A1016]/40 p-6 space-y-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">Compared to Excel & Manual Logs</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Eliminate human spreadsheet entry errors. Remaining leave pools deduct instantly and live stopwatches document shift durations.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-800 bg-[#0A1016]/40 p-6 space-y-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">Compared to Corporate Suites</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Avoid rigid, complex workflow setups. ANSH is lightweight, updates profiles in real-time, and has transparent flat pricing.
            </p>
          </div>
        </div>

        {/* Comparison Model Footers */}
        <div className="grid gap-6 md:grid-cols-2 pt-6">
          <div className="bg-[#05110E] border border-emerald-500/15 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">THE ANSH HR MODEL FOR MSMEs</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unified client-side face scans, ticking clocks, real-time balances, simple digital pricing, and zero setup friction.
            </p>
          </div>

          <div className="bg-[#110508] border border-rose-500/15 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block">THE BLOATED ENTERPRISE MODEL</span>
            <p className="text-xs text-slate-350 leading-relaxed">
              Expensive legacy hardware, slow database syncs, manual registers, hidden user fees, and complex setup processes.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="relative z-10 mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-12 xl:px-16 py-24 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-400">
            Got questions about ANSH HR? Find quick answers below.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "What is included in the Free plan?",
              a: "Free workspaces include up to 3 teammates and 50 punch-ins per month. You get punch in/out attendance tracking, default Annual, Sick, and Casual leave pools, basic leave requests with manager approvals, and an employee directory with live leave balances. Custom shifts, leave categories, holidays, policies, and reports are not included on Free."
            },
            {
              q: "What does the Pro plan unlock?",
              a: "Pro is billed per user per month based on your current team size — you pay ₹199 for each teammate when you subscribe. You get unlimited punch-ins plus a shift roster manager with custom timings, custom leave categories and rules, company holiday calendars by branch, policy document uploads, and team analytics with punctuality reports. CSV/PDF exports and audit trails are planned and marked as coming soon."
            },
            {
              q: "Do new workspaces get a Pro trial?",
              a: "Yes. Every new workspace starts with a 14-day Pro trial with full access to all Pro modules. You can subscribe to Pro anytime during the trial — billing starts when the trial ends. If you don't subscribe, your workspace continues on the Free plan after the trial."
            },
            {
              q: "Is the client-side facial recognition scan safe and private?",
              a: "Yes. Face landmark matching runs entirely in your browser using face-api.js — live camera frames are not sent to our servers for verification. Reference photos are downscaled to 800px before upload and stored in a private Supabase S3 bucket. You can delete your biometric profile at any time, which clears all stored face data."
            },
            {
              q: "Are leave deductions automatic upon manager approval?",
              a: "Yes. When a manager approves a leave request, the requested days are deducted immediately from the employee's Annual, Sick, or Casual balance. Rejected requests do not affect balances."
            },
            {
              q: "Can I customize the workspace accent color?",
              a: "Yes. Each user can switch their dashboard accent between Emerald, Indigo, Sapphire, and Graphite from profile settings. The selected color updates buttons, badges, and highlights across the workspace UI."
            }
          ].map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-[#0A1016]/40 overflow-hidden transition-colors duration-200"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between text-slate-200 hover:text-white font-bold text-sm cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className={`transform transition-transform duration-200 text-slate-500 ${isOpen ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>
                
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-80 border-t border-slate-800 bg-slate-950/20" : "max-h-0"
                  }`}
                >
                  <p className="px-6 py-4 text-xs text-slate-400 leading-relaxed font-semibold">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. FOOTER CTA BANNER */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-12 xl:px-16 pb-24">
        <div className="rounded-3xl border border-slate-800 bg-[#070D14] p-10 text-center relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-sky-500/5 blur-3xl" />
          
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Ready to accelerate your team's workflow?
          </h2>
          
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Create your free workspace in under two minutes. No credit card required. Enjoy complete access to biometric setups, leave allowance logs, and status registries.
          </p>

          <div className="flex justify-center pt-2">
            <Link href="/signup">
              <button className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500 px-8 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/15 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                Launch ANSH HR Now
                <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2.5} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. GRAND SYMMETRICAL FOOTER */}
      <footer className="relative z-10 border-t border-white/5 bg-[#03060C] pt-20 pb-10">
        <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 lg:px-12 xl:px-16 space-y-12">
          
          {/* Big Text Banner: Ansh Apps */}
          <div className="text-center select-none border-b border-white/5 pb-12 overflow-hidden">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">HANDLED BY ANSH</span>
            <h1 className="text-6xl sm:text-8xl md:text-[10rem] lg:text-[12rem] xl:text-[14rem] font-black bg-gradient-to-r from-sky-400 via-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tighter opacity-95 leading-none py-4">
              Ansh Apps
            </h1>
          </div>

          {/* Symmetrical Columns */}
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 text-xs font-semibold">
            {/* Column 1 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img
                  src="/logoAnshapps.png"
                  alt="Ansh Apps Logo"
                  className="h-6 w-6 object-contain"
                />
                <span className="font-extrabold tracking-wider text-slate-200">ANSH HR</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs font-medium">
                The ultimate leave & attendance workspace designed for modern high-performance teams who scale natively.
              </p>
            </div>

            {/* Column 2 */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Product</h4>
              <ul className="space-y-2 text-slate-500">
                <li><a href="#punch" className="hover:text-white transition-colors">Punch Clock</a></li>
                <li><a href="#leaves" className="hover:text-white transition-colors">Leaves Gallery</a></li>
                <li><a href="#approvals" className="hover:text-white transition-colors">Approvals Queue</a></li>
                <li><a href="#team" className="hover:text-white transition-colors">Status Registry</a></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Account</h4>
              <ul className="space-y-2 text-slate-500">
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link href="/onboarding" className="hover:text-white transition-colors">Workspace Setup</Link></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Get In Touch</h4>
              <p className="text-slate-500 leading-normal text-[11px] font-medium">
                Have questions or need custom business plans? Talk to our creators.
              </p>
              <a
                href="mailto:hello@anshapps.com"
                className="text-emerald-400 hover:text-emerald-300 hover:underline inline-block pt-1 font-bold transition-colors"
              >
                hello@anshapps.com
              </a>
            </div>
          </div>

          {/* Bottom Copyright Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-8 text-[11px] text-slate-500 font-medium">
            <span>© 2026 ANSH HR. All rights reserved.</span>
            <div className="flex gap-4.5 mt-4 sm:mt-0">
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms & Conditions</Link>
              <a href="mailto:hello@anshapps.com" className="hover:text-slate-300 transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
