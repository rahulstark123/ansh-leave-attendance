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
  Bell,
  Phone,
  Mail
} from "lucide-react";
import { TrustCompliance } from "@/components/shared/trust-compliance";
import { MsmeBadge } from "@/components/shared/msme-badge";
import { PAGE_SHELL } from "@/components/layout/page-shell";
import { LandingThemeToggle } from "@/components/landing/landing-theme-toggle";
import {
  LANDING_BODY,
  LANDING_CARD,
  LANDING_CTA_CARD,
  LANDING_COMPARISON_CARD,
  LANDING_FAQ_ITEM,
  LANDING_FOOTER,
  LANDING_GRID_BG,
  LANDING_GRID_BG_DARK,
  LANDING_GRID_OVERLAY,
  LANDING_HEADING,
  LANDING_HEADER,
  LANDING_MARQUEE_CARD,
  LANDING_MARQUEE_FADE_LEFT,
  LANDING_MARQUEE_FADE_RIGHT,
  LANDING_MUTED,
  LANDING_NAV,
  LANDING_NAV_LINK,
  LANDING_PAGE,
  LANDING_PANEL,
  LANDING_PRICING_CARD,
  LANDING_SECTION,
  LANDING_SECTION_ALT,
  LANDING_SIGN_IN_BTN,
  LANDING_SUBTEXT,
  LANDING_SURFACE,
} from "@/components/landing/landing-styles";
import { useUiStore } from "@/stores/ui-store";

type MockTab = "punch" | "leaves" | "team";
type AccentTheme = "violet" | "indigo" | "cyan" | "graphite";

const brandGradientText =
  "bg-gradient-to-r from-[#00c6ff] via-[#7000ff] to-[#e040fb] bg-clip-text text-transparent dark:from-[#4dc4ff] dark:via-[#8b5cf6] dark:to-[#e879f9]";
const brandBtnPrimary =
  "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg shadow-violet-600/25";
const brandBtnCta =
  "bg-gradient-to-r from-[#00c6ff] to-[#9333ea] hover:from-[#00b4ea] hover:to-[#7c22d4] text-white shadow-lg shadow-violet-500/25";
const brandBadgePill =
  "border border-violet-500/25 bg-violet-500/10 text-violet-600 dark:border-violet-500/20 dark:text-violet-400";
const brandCheckCircle =
  "bg-violet-500/10 text-violet-600 dark:bg-blue-500/10 dark:text-violet-400";

const ecosystemApps = [
  {
    name: "ANSH Booking",
    subtitle: "Meeting room & resource booking",
    description: "Reserve rooms, assets and slots with ease",
    status: "BUILDING",
    isLive: false,
    badgeText: "BUILDING",
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
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
    badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    dotColor: "bg-violet-500",
    borderColor: "hover:border-violet-500/30 hover:shadow-violet-500/5",
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
    badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
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
    badgeColor: "bg-violet-500/15 text-violet-400 border-violet-500/30 animate-pulse",
    dotColor: "bg-[#7000FF]",
    borderColor: "border-violet-500/40 hover:border-violet-500/60 shadow-violet-500/5",
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
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    dotColor: "bg-amber-500",
    borderColor: "hover:border-amber-500/35 hover:shadow-amber-500/5",
    image: "/ANSH Expense.jpg",
    link: "https://expense.anshapps.com",
  },
  {
    name: "ANSH Forms",
    subtitle: "Smart form builder",
    description: "Create forms, collect responses & track submissions",
    status: "LIVE",
    isLive: true,
    badgeText: "LIVE",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    dotColor: "bg-emerald-500",
    borderColor: "hover:border-emerald-500/35 hover:shadow-emerald-500/5",
    image: "/ANSH Forms.jpg",
    link: "https://forms.anshapps.com",
  },
  {
    name: "ANSH Links",
    subtitle: "Link-in-bio profile builder",
    description: "Showcase identity, social links, WhatsApp & UPI in one page",
    status: "LIVE",
    isLive: true,
    badgeText: "LIVE",
    badgeColor: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25",
    dotColor: "bg-pink-500",
    borderColor: "hover:border-pink-500/35 hover:shadow-pink-500/5",
    image: "/ANSH Links.jpg",
    link: "https://links.anshapps.com",
  },
];

export default function LandingPage() {
  const appearance = useUiStore((s) => s.appearance);
  const isDark = appearance === "dark";
  const [sessionActive, setSessionActive] = useState(false);
  const [activeTab, setActiveTab] = useState<MockTab>("punch");
  const [activeAccent, setActiveAccent] = useState<AccentTheme>("violet");
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
    violet: "text-violet-400",
    indigo: "text-indigo-400",
    cyan: "text-[#4dc4ff]",
    graphite: "text-slate-300"
  }[activeAccent];

  const accentBgClass = {
    violet: "bg-violet-500",
    indigo: "bg-indigo-500",
    cyan: "bg-[#00C6FF]",
    graphite: "bg-slate-500"
  }[activeAccent];

  const accentBadgeClass = {
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    cyan: "bg-[#00C6FF]/10 text-[#4dc4ff] border-[#00C6FF]/20",
    graphite: "bg-slate-500/10 text-slate-300 border-slate-500/20"
  }[activeAccent];

  const accentBorderClass = {
    violet: "border-violet-500/20 hover:border-violet-500/40",
    indigo: "border-indigo-500/20 hover:border-indigo-500/40",
    cyan: "border-[#00C6FF]/20 hover:border-[#00C6FF]/40",
    graphite: "border-slate-700 hover:border-slate-600"
  }[activeAccent];

  const accentGlowClass = {
    violet: "shadow-violet-500/20",
    indigo: "shadow-indigo-500/20",
    cyan: "shadow-[#00C6FF]/20",
    graphite: "shadow-slate-500/20"
  }[activeAccent];

  return (
    <div className={LANDING_PAGE}>
      {/* Ambient brand glow blobs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[30%] -left-[10%] h-[70%] w-[50%] rounded-full bg-[#00c6ff]/10 blur-[120px] dark:bg-[#00c6ff]/5" />
        <div className="absolute top-[20%] -right-[10%] h-[60%] w-[40%] rounded-full bg-[#7000ff]/10 blur-[100px] dark:bg-[#7000ff]/5" />
        <div className="absolute bottom-[10%] left-[20%] h-[50%] w-[50%] rounded-full bg-[#e040fb]/10 blur-[130px] dark:bg-[#e040fb]/5" />
        <div
          className={LANDING_GRID_OVERLAY}
          style={{
            backgroundImage: isDark ? LANDING_GRID_BG_DARK : LANDING_GRID_BG,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* 1. SYMMETRICAL NAVIGATION HEADER */}
      <header className={LANDING_HEADER}>
        <div className={`${PAGE_SHELL} h-16 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <img
              src="/logoAnshapps.png"
              alt="Ansh Apps Logo"
              className="h-9 w-9 object-contain"
            />
            <div>
              <span className={`font-extrabold text-sm tracking-wider uppercase block ${LANDING_HEADING}`}>
                ANSH HR
              </span>
            </div>
          </div>

          <nav className={LANDING_NAV}>
            <a href="#features" className={LANDING_NAV_LINK}>Features</a>
            <a href="#biometrics" className={LANDING_NAV_LINK}>Face Setup</a>
            <a href="#pricing" className={LANDING_NAV_LINK}>Pricing</a>
            <a href="#comparison" className={LANDING_NAV_LINK}>Why ANSH</a>
          </nav>

          <div className="flex items-center gap-3">
            <LandingThemeToggle />
            {sessionActive ? (
              <Link href="/dashboard">
                <button className={`inline-flex h-10 items-center justify-center rounded-xl px-5 text-xs font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${brandBtnPrimary}`}>
                  Go to Dashboard
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className={LANDING_SIGN_IN_BTN}>
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className={`relative z-10 ${PAGE_SHELL} pt-16 pb-24`}>
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-7 text-left">
            <div className={`inline-flex items-center gap-2.5 rounded-full px-4.5 py-1.5 backdrop-blur-md ${brandBadgePill}`}>
              <Sparkles className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-violet-600 dark:text-violet-400">
                Built for MSMEs & Scaling Teams
              </span>
            </div>

            <h1 className={`font-sans text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight ${LANDING_HEADING}`}>
              Run Your Entire HR, Leaves &{" "}
              <span className={brandGradientText}>
                Attendance
              </span>{" "}
              in One Workspace
            </h1>

            <p className={`text-sm sm:text-base leading-relaxed max-w-xl ${LANDING_SUBTEXT}`}>
              ANSH Leave & Attendance combines high-speed facial recognition check-ins, live ticking shift stopwatches, dynamic allowance requests, and role-guarded pipelines into a unified, high-performance portal.
            </p>

            {/* Benefit Checkmarks Grid (2x2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${brandCheckCircle} mt-0.5`}>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${LANDING_BODY}`}>Biometric Face Verification</h4>
                  <p className={`text-[10px] mt-0.5 ${LANDING_MUTED}`}>Scan profiles client-side with zero network lag.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${brandCheckCircle} mt-0.5`}>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${LANDING_BODY}`}>Live Ticking Shift Clock</h4>
                  <p className={`text-[10px] mt-0.5 ${LANDING_MUTED}`}>Watch active hours track down to the second.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${brandCheckCircle} mt-0.5`}>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${LANDING_BODY}`}>Automatic Leave Deductions</h4>
                  <p className={`text-[10px] mt-0.5 ${LANDING_MUTED}`}>Real-time allowances (Annual, Sick, Casual).</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${brandCheckCircle} mt-0.5`}>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${LANDING_BODY}`}>Role-Guarded Approvals</h4>
                  <p className={`text-[10px] mt-0.5 ${LANDING_MUTED}`}>Strict admin/manager approval dashboards.</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <button className={`inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-2xl px-8 text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${brandBtnCta}`}>
                  Start your 14 days Free trial
                  <Play className="ml-2 h-4 w-4 fill-current" />
                </button>
              </Link>
              <a href="https://anshapps.com/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <button className={`inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 px-8 text-sm font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-all cursor-pointer dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white`}>
                  Visit ANSH
                </button>
              </a>
            </div>

            <div className="pt-6 border-t border-zinc-200/80 dark:border-white/5">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${LANDING_MUTED}`}>
                Built from Bharat for the World — encouraging{" "}
                <span className="text-violet-600 dark:text-violet-400">Vasudhaiva Kutumbakam</span>
              </p>
            </div>
          </div>

          {/* Hero Right Mockup Frame (Toggles and Accent selection) — always dark */}
          <div className="lg:col-span-5 relative dark">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0078FF]/10 via-[#7000FF]/10 to-[#E040FB]/10 rounded-3xl blur-2xl -z-10" />
            
            {/* Interactive Browser Frame */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 shadow-2xl p-5 space-y-5 select-none relative overflow-hidden">
              {/* Browser Dot Controls */}
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <span className="h-3 w-3 rounded-full bg-violet-500/80" />
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
                      <span className="text-[9px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/10">
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
                  {(["violet", "indigo", "cyan", "graphite"] as AccentTheme[]).map((theme) => {
                    const bgCircle = {
                      violet: "bg-violet-500",
                      indigo: "bg-indigo-500",
                      cyan: "bg-[#00C6FF]",
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
      <section className={LANDING_SECTION_ALT}>
        <div className={`${PAGE_SHELL} space-y-12`}>
          {/* Header Row */}
          <div className="grid gap-6 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7 space-y-2">
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest block">
                Ecosystem
              </span>
              <h2 className={`text-3xl font-black tracking-tight sm:text-4xl ${LANDING_HEADING}`}>
                The full <span className={brandGradientText}>Ansh Apps</span> suite
              </h2>
            </div>
            <div className="md:col-span-5">
              <p className={`text-sm sm:text-base leading-relaxed font-medium ${LANDING_SUBTEXT}`}>
                One ecosystem, every business operation — manage tasks, HR, expenses, bookings, visitors, forms and links from connected apps.
              </p>
            </div>
          </div>
        </div>

        {/* Marquee — full viewport width */}
        <div className="relative w-full overflow-hidden mt-12">
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
            <div className={LANDING_MARQUEE_FADE_LEFT} />
            <div className={LANDING_MARQUEE_FADE_RIGHT} />

            {/* Scrolling Marquee Container */}
            <div className="custom-marquee-container py-4 gap-6">
              {[...ecosystemApps, ...ecosystemApps].map((app, index) => (
                <a
                  key={`${app.name}-${index}`}
                  href={app.link}
                  target={app.link.startsWith("http") ? "_blank" : undefined}
                  rel={app.link.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={`${LANDING_MARQUEE_CARD} ${app.borderColor} hover:-translate-y-1 cursor-pointer`}
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
                        <h4 className={`text-base font-bold ${LANDING_BODY}`}>{app.name}</h4>
                      </div>
                      {/* Status pill button */}
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                        app.status === "BUILDING"
                          ? "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5"
                          : app.name === "ANSH HR"
                            ? "border-violet-500/40 text-violet-400 bg-violet-500/10"
                            : "border-violet-500/30 text-violet-400 bg-violet-500/5"
                      }`}>
                        {app.status === "BUILDING" ? "Soon" : "Live"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className={`text-sm font-bold ${LANDING_BODY}`}>{app.subtitle}</p>
                      <p className={`text-xs font-medium leading-relaxed ${LANDING_SUBTEXT}`}>{app.description}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
        </div>
      </section>

      {/* 3. FEATURES GRID ("Streamline Your Entire HR Operations Natively") */}
      <section id="features" className={LANDING_SECTION}>
        <div className={`${PAGE_SHELL} space-y-16`}>
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${LANDING_HEADING}`}>
              Streamline Your Entire HR Operations Natively
            </h2>
            <p className={`text-sm leading-relaxed ${LANDING_SUBTEXT}`}>
              No need to pay for multiple software tools. ANSH HR consolidates your attendance registers, facial scans, allowances, and employee directories under one affordable platform.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className={`${LANDING_CARD} space-y-4`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                <Fingerprint className="h-5 w-5" />
              </div>
              <h3 className={`text-sm font-bold ${LANDING_BODY}`}>Facial Recognition Punch-In</h3>
              <p className={`text-xs leading-relaxed ${LANDING_SUBTEXT}`}>
                Process facial landmark coordinates client-side with face-api.js. Provides secure authentication with zero server processing latency.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`${LANDING_CARD} space-y-4`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className={`text-sm font-bold ${LANDING_BODY}`}>Live Stopwatch Clocking</h3>
              <p className={`text-xs leading-relaxed ${LANDING_SUBTEXT}`}>
                A live stopwatch tracks your check-in length down to the second in the dashboard, with built-in tolerance rules for grace check-ins.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`${LANDING_CARD} space-y-4`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                <CalendarDays className="h-5 w-5" />
              </div>
              <h3 className={`text-sm font-bold ${LANDING_BODY}`}>Dynamic Allowance Pools</h3>
              <p className={`text-xs leading-relaxed ${LANDING_SUBTEXT}`}>
                Employees can request Annual, Sick, or Casual leaves through dialog forms. Remaining balances automatically update on approval.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`${LANDING_CARD} space-y-4`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className={`text-sm font-bold ${LANDING_BODY}`}>Glassmorphic Approvals Queue</h3>
              <p className={`text-xs leading-relaxed ${LANDING_SUBTEXT}`}>
                A dedicated request pipeline for HR Managers and Admins to accept/deny requests, complete with automatic employee balance updates.
              </p>
            </div>

            {/* Feature 5 */}
            <div className={`${LANDING_CARD} space-y-4`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                <Users2 className="h-5 w-5" />
              </div>
              <h3 className={`text-sm font-bold ${LANDING_BODY}`}>Team Status Registry</h3>
              <p className={`text-xs leading-relaxed ${LANDING_SUBTEXT}`}>
                Visual directory showcasing active employee counts. Search, filter by department, and review individual statuses in real-time.
              </p>
            </div>

            {/* Feature 6 */}
            <div className={`${LANDING_CARD} space-y-4`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className={`text-sm font-bold ${LANDING_BODY}`}>Accent Theme Customization</h3>
              <p className={`text-xs leading-relaxed ${LANDING_SUBTEXT}`}>
                Dynamic theme switcher. Swap the primary color theme instantly between Violet, Indigo, Cyan, and Graphite system styles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DETAILED BIOMETRIC SETUP FEATURE SECTION */}
      <section id="biometrics" className={`relative z-10 ${PAGE_SHELL} py-24`}>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Biometrics Setup Mockup — always dark (product preview) */}
          <div className="dark relative rounded-3xl border border-zinc-800 bg-zinc-900/85 p-6 shadow-2xl backdrop-blur-md overflow-hidden">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-5">
              Secure Enrollment Console
            </span>
            
            <div className="grid grid-cols-3 gap-3">
              {/* Slot 1: Front */}
              <div className="space-y-1.5 text-center">
                <div className="aspect-[4/3] rounded-xl border border-slate-700 bg-slate-900/60 flex flex-col items-center justify-center relative shadow-sm overflow-hidden p-1">
                  <div className="absolute inset-0 bg-violet-500/5" />
                  <Camera className="h-5 w-5 text-violet-400" />
                  <span className="text-[8px] font-semibold text-slate-400 mt-1 block">Front view</span>
                  <div className="absolute bottom-2 right-2 bg-violet-500 text-white p-0.5 rounded-full">
                    <Check className="h-2 w-2" strokeWidth={4} />
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Front Profile</span>
              </div>

              {/* Slot 2: Left */}
              <div className="space-y-1.5 text-center">
                <div className="aspect-[4/3] rounded-xl border border-slate-700 bg-slate-900/60 flex flex-col items-center justify-center relative shadow-sm overflow-hidden p-1">
                  <div className="absolute inset-0 bg-violet-500/5" />
                  <Camera className="h-5 w-5 text-violet-400" />
                  <span className="text-[8px] font-semibold text-slate-400 mt-1 block">Left angle</span>
                  <div className="absolute bottom-2 right-2 bg-violet-500 text-white p-0.5 rounded-full">
                    <Check className="h-2 w-2" strokeWidth={4} />
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Left Angle</span>
              </div>

              {/* Slot 3: Right */}
              <div className="space-y-1.5 text-center">
                <div className="aspect-[4/3] rounded-xl border border-slate-700 bg-slate-900/60 flex flex-col items-center justify-center relative shadow-sm overflow-hidden p-1">
                  <div className="absolute inset-0 bg-violet-500/5" />
                  <Camera className="h-5 w-5 text-violet-400" />
                  <span className="text-[8px] font-semibold text-slate-400 mt-1 block">Right angle</span>
                  <div className="absolute bottom-2 right-2 bg-violet-500 text-white p-0.5 rounded-full">
                    <Check className="h-2 w-2" strokeWidth={4} />
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Right Angle</span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Info className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                <span>Client-Side Face Validation</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Images are temporarily drawn onto canvas to compute landmark embeddings via tinyFaceDetector model. Original files are resized to 800px and stored in Supabase S3.
              </p>
            </div>
          </div>

          {/* Biometrics Setup Description */}
          <div className="space-y-6">
            <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 ${brandBadgePill}`}>
              <Fingerprint className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Fast Setup</span>
            </div>
            <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${LANDING_HEADING}`}>
              Enroll Face Signatures in 3 Quick Photo Uploads
            </h2>
            <p className={`leading-relaxed text-sm ${LANDING_SUBTEXT}`}>
              We process face parameters directly in the user's browser, extract a 128-float mathematical model, and store optimized files. This speeds up daily punch-ins and avoids webcam delays.
            </p>
            <ul className={`space-y-3.5 text-xs font-semibold ${LANDING_BODY}`}>
              <li className="flex items-center gap-3">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${brandCheckCircle}`}>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <span>Requires 3 reference images (Front, Left Profile, Right Profile)</span>
              </li>
              <li className="flex items-center gap-3">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${brandCheckCircle}`}>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <span>Automatic client-side downscaling to 800px for speedy uploads</span>
              </li>
              <li className="flex items-center gap-3">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${brandCheckCircle}`}>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <span>Clears database signatures instantly upon scan deletions</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4.5. LIVE ACTIVITY FEED & ANNOUNCEMENTS SECTION */}
      <section id="announcements" className={LANDING_SECTION}>
        <div className={`${PAGE_SHELL} space-y-16`}>
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${LANDING_HEADING}`}>
              Live Activity Feed & Broadcast Announcements
            </h2>
            <p className={`text-sm leading-relaxed ${LANDING_SUBTEXT}`}>
              Keep your entire workforce synchronized with dynamic organization-wide events and corporate bulletins. Build trust and alignment through real-time communication.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
            
            {/* Column 1: Live Activity Feed */}
            <div className={`flex flex-col justify-between ${LANDING_PANEL} space-y-6`}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest block">Real-Time Updates</span>
                    <h3 className={`text-lg font-bold ${LANDING_BODY}`}>Organization Activity Logs</h3>
                  </div>
                </div>
                
                <p className={`text-xs leading-relaxed ${LANDING_SUBTEXT}`}>
                  Watch shift check-ins, leave requests, and status changes propagate across your team directory instantly.
                </p>

                <div className="space-y-3 pt-2">
                  {/* Event 1 */}
                  <div className="flex gap-3 items-start p-3 bg-zinc-100 border border-zinc-200/80 rounded-2xl hover:border-violet-500/25 transition-all dark:bg-zinc-950/60 dark:border-zinc-800/60 dark:hover:border-violet-500/20">
                    <div className="h-7 w-7 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0 text-xs font-black">
                      RR
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className={`text-xs font-bold ${LANDING_BODY}`}>Rahul Raj</span>
                        <span className={`text-[9px] font-mono ${LANDING_MUTED}`}>09:02 AM</span>
                      </div>
                      <p className={`text-[10px] mt-0.5 leading-normal ${LANDING_SUBTEXT}`}>Punched in at Mumbai Office (Selfie verified)</p>
                    </div>
                  </div>

                  {/* Event 2 */}
                  <div className="flex gap-3 items-start p-3 bg-zinc-100 border border-zinc-200/80 rounded-2xl hover:border-sky-500/25 transition-all dark:bg-slate-950/60 dark:border-slate-800/60 dark:hover:border-sky-500/20">
                    <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 text-xs font-black">
                      AP
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className={`text-xs font-bold ${LANDING_BODY}`}>Amit Patel</span>
                        <span className={`text-[9px] font-mono ${LANDING_MUTED}`}>Yesterday</span>
                      </div>
                      <p className={`text-[10px] mt-0.5 leading-normal ${LANDING_SUBTEXT}`}>Requested 1-day Sick Leave (Awaiting HR Review)</p>
                    </div>
                  </div>

                  {/* Event 3 */}
                  <div className="flex gap-3 items-start p-3 bg-zinc-100 border border-zinc-200/80 rounded-2xl hover:border-purple-500/25 transition-all dark:bg-slate-950/60 dark:border-slate-800/60 dark:hover:border-purple-500/20">
                    <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 text-xs font-black">
                      SYS
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className={`text-xs font-bold ${LANDING_BODY}`}>System Accrual</span>
                        <span className={`text-[9px] font-mono ${LANDING_MUTED}`}>1st Jun</span>
                      </div>
                      <p className={`text-[10px] mt-0.5 leading-normal ${LANDING_SUBTEXT}`}>Credited monthly leave allowances (+1.5 Annual Days)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Pinned Announcements */}
            <div className={`flex flex-col justify-between ${LANDING_PANEL} space-y-6`}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 group-hover:bg-sky-500/20 transition-colors">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest block">Notice Board</span>
                    <h3 className={`text-lg font-bold ${LANDING_BODY}`}>Active Announcements</h3>
                  </div>
                </div>

                <p className={`text-xs leading-relaxed ${LANDING_SUBTEXT}`}>
                  Pin company-wide notices for holiday updates, policy changes, office announcements, or safety guidelines.
                </p>

                <div className="space-y-3.5 pt-2">
                  {/* Announcement 1 */}
                  <div className="p-4 bg-zinc-100 border border-zinc-200/80 rounded-2xl relative overflow-hidden group hover:border-sky-500/25 transition-all dark:bg-slate-950/60 dark:border-slate-800/60 dark:hover:border-sky-500/25">
                    <div className="absolute top-0 right-0 bg-sky-500/10 text-sky-400 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl-xl border-l border-b border-sky-500/15">
                      Important
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-bold ${LANDING_BODY}`}>
                      <Bell className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span>Q3 General Strategy Meeting</span>
                    </div>
                    <p className={`text-[10px] mt-1.5 leading-relaxed ${LANDING_MUTED}`}>
                      All employees are requested to attend the Q3 townhall town hall session scheduled for Friday, June 19th at 3:00 PM IST.
                    </p>
                    <div className={`flex items-center gap-1.5 mt-2.5 text-[9px] font-semibold ${LANDING_MUTED}`}>
                      <span>HR Department</span>
                      <span>·</span>
                      <span>2 hours ago</span>
                    </div>
                  </div>

                  {/* Announcement 2 */}
                  <div className="p-4 bg-zinc-100 border border-zinc-200/80 rounded-2xl relative overflow-hidden group hover:border-violet-500/25 transition-all dark:bg-zinc-950/60 dark:border-zinc-800/60 dark:hover:border-violet-500/20">
                    <div className={`flex items-center gap-2 text-xs font-bold ${LANDING_BODY}`}>
                      <CalendarDays className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                      <span>Independence Day Holiday Calendar</span>
                    </div>
                    <p className={`text-[10px] mt-1.5 leading-relaxed ${LANDING_MUTED}`}>
                      Please note that August 15th will be observed as a national holiday across all registered branch offices.
                    </p>
                    <div className={`flex items-center gap-1.5 mt-2.5 text-[9px] font-semibold ${LANDING_MUTED}`}>
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
      <section id="pricing" className={LANDING_SECTION}>
        <div className={`${PAGE_SHELL} space-y-16`}>
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${brandBadgePill}`}>
              <span className="text-[9px] font-bold tracking-widest uppercase text-violet-600 dark:text-violet-400">Flexible Pricing</span>
            </div>
            <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${LANDING_HEADING}`}>
              Flexible Plans Tailored for Your Scale
            </h2>
            <p className={`text-xs sm:text-sm ${LANDING_SUBTEXT}`}>
              Start with core leave and attendance for free. Compare what each plan includes — you can manage billing inside your workspace when you are ready.
            </p>
          </div>

          <div className="grid gap-6 max-w-4xl mx-auto sm:grid-cols-2">
            {/* Free Plan */}
            <div className={`${LANDING_PRICING_CARD} space-y-6`}>
              <div className="space-y-4">
                <div className={`inline-flex rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${LANDING_MUTED} border-zinc-200 bg-zinc-100 dark:bg-slate-900 dark:border-slate-800`}>
                  For Micro Teams
                </div>
                <div className="space-y-1">
                  <h3 className={`text-lg font-bold ${LANDING_HEADING}`}>Free Plan</h3>
                  <p className={`text-[10px] leading-normal ${LANDING_MUTED}`}>Ideal for small business founders getting started.</p>
                </div>
                <div className={`flex items-baseline ${LANDING_HEADING}`}>
                  <span className="text-3xl font-black tracking-tight">₹0</span>
                  <span className={`ml-1 text-[11px] font-semibold ${LANDING_MUTED}`}>/ workspace</span>
                </div>
                <ul className={`space-y-3.5 pt-4 text-xs font-medium ${LANDING_BODY}`}>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={3} />
                    <span>Up to 3 teammates</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={3} />
                    <span>50 punch-ins per month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={3} />
                    <span>Punch in/out attendance tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={3} />
                    <span>Default annual, sick, and casual leave</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={3} />
                    <span>Basic leave requests and approvals</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={3} />
                    <span>Employee directory and leave balances</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Plan */}
            <div className={`${LANDING_PRICING_CARD} border-violet-500/25 hover:border-violet-500/40 shadow-xl shadow-violet-500/10 dark:shadow-violet-950/20 space-y-6`}>
              <div className="space-y-4">
                <div className={`inline-flex rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${brandBadgePill}`}>
                  Best for MSMEs
                </div>
                <div className="space-y-1">
                  <h3 className={`text-lg font-bold ${LANDING_HEADING}`}>Pro Plan</h3>
                  <p className={`text-[10px] leading-normal ${LANDING_MUTED}`}>Per-user pricing that scales with every teammate you add.</p>
                </div>
                <div className={`flex items-baseline ${LANDING_HEADING}`}>
                  <span className="text-3xl font-black tracking-tight">₹199</span>
                  <span className={`ml-1 text-[11px] font-semibold ${LANDING_MUTED}`}>/ user / month</span>
                </div>
                <ul className={`space-y-3.5 pt-4 text-xs font-medium ${LANDING_BODY}`}>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={3} />
                    <span>Per-user pricing — scales with your team size</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={3} />
                    <span>Unlimited punch-ins</span>
                  </li>

                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={3} />
                    <span>Shift roster manager with custom timings</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={3} />
                    <span>Custom leave categories and rules</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={3} />
                    <span>Company holiday calendar by branch</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={3} />
                    <span>Policy document hub and handbook uploads</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={3} />
                    <span>Team analytics, punctuality, and reports</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMPARISON MATRIX ("Why teams choose ANSH HR over legacy biometric systems") */}
      <section id="comparison" className={`relative z-10 ${PAGE_SHELL} py-24 space-y-16`}>
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className={`inline-flex items-center gap-2.5 rounded-full px-4.5 py-1.5 ${brandBadgePill}`}>
            <span className="text-[10px] font-bold tracking-widest uppercase text-violet-600 dark:text-violet-400">
              Why Teams Switch
            </span>
          </div>
          <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${LANDING_HEADING}`}>
            Why MSMEs choose ANSH HR over Zoho, biometric machines, and manual registers
          </h2>
          <p className={`text-sm leading-relaxed ${LANDING_SUBTEXT}`}>
            We are built specifically for small & medium businesses that want real work execution, cleaner dashboard views, and zero setup friction.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <div className={LANDING_COMPARISON_CARD}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <Layers className="h-4 w-4" />
            </div>
            <h3 className={`text-sm font-bold ${LANDING_BODY}`}>Compared to Biometric Hardware</h3>
            <p className={`text-xs leading-relaxed ${LANDING_MUTED}`}>
              No expensive thumb-scanners or physical wall installations required. Staff check-in from their own screens with secure camera feeds.
            </p>
          </div>

          {/* Card 2 */}
          <div className={LANDING_COMPARISON_CARD}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className={`text-sm font-bold ${LANDING_BODY}`}>Compared to Excel & Manual Logs</h3>
            <p className={`text-xs leading-relaxed ${LANDING_MUTED}`}>
              Eliminate human spreadsheet entry errors. Remaining leave pools deduct instantly and live stopwatches document shift durations.
            </p>
          </div>

          {/* Card 3 */}
          <div className={LANDING_COMPARISON_CARD}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <Lock className="h-4 w-4" />
            </div>
            <h3 className={`text-sm font-bold ${LANDING_BODY}`}>Compared to Corporate Suites</h3>
            <p className={`text-xs leading-relaxed ${LANDING_MUTED}`}>
              Avoid rigid, complex workflow setups. ANSH is lightweight, updates profiles in real-time, and has transparent flat pricing.
            </p>
          </div>
        </div>

        {/* Comparison Model Footers */}
        <div className="grid gap-6 md:grid-cols-2 pt-6">
          <div className="bg-violet-500/5 border border-violet-500/15 rounded-2xl p-5 space-y-2 dark:bg-zinc-900/60">
            <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest block dark:text-violet-400">THE ANSH HR MODEL FOR MSMEs</span>
            <p className={`text-xs leading-relaxed ${LANDING_BODY}`}>
              Unified client-side face scans, ticking clocks, real-time balances, simple digital pricing, and zero setup friction.
            </p>
          </div>

          <div className="bg-[#110508] border border-rose-500/15 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block dark:text-rose-400">THE BLOATED ENTERPRISE MODEL</span>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Expensive legacy hardware, slow database syncs, manual registers, hidden user fees, and complex setup processes.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className={`relative z-10 ${PAGE_SHELL} py-24`}>
        <div className="mx-auto max-w-4xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${LANDING_HEADING}`}>
            Frequently Asked Questions
          </h2>
          <p className={`text-sm ${LANDING_SUBTEXT}`}>
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
              a: "Yes. Each user can switch their dashboard accent between Violet, Indigo, Cyan, and Graphite from profile settings. The selected color updates buttons, badges, and highlights across the workspace UI."
            }
          ].map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={LANDING_FAQ_ITEM}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className={`w-full text-left px-6 py-5 flex items-center justify-between font-bold text-sm cursor-pointer ${LANDING_BODY} hover:text-violet-600 dark:hover:text-white`}
                >
                  <span>{faq.q}</span>
                  <span className={`transform transition-transform duration-200 text-zinc-500 dark:text-zinc-400 ${isOpen ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>
                
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-80 border-t border-zinc-200 bg-zinc-50/80 dark:border-slate-800 dark:bg-slate-950/20" : "max-h-0"
                  }`}
                >
                  <p className={`px-6 py-4 text-xs leading-relaxed font-semibold ${LANDING_SUBTEXT}`}>
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </section>

      {/* 8. FOOTER CTA BANNER */}
      <section className={`relative z-10 ${PAGE_SHELL} pb-24`}>
        <div className="mx-auto max-w-5xl">
        <div className={LANDING_CTA_CARD}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom right, rgba(0, 120, 255, 0.10), rgba(112, 0, 255, 0.10), rgba(224, 64, 251, 0.10))",
            }}
          />
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-[#7000FF]/10 blur-[70px]" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#00C6FF]/10 blur-[80px]" />
          
          <div className="relative flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>

          <h2 className={`relative text-3xl font-extrabold tracking-tight sm:text-4xl ${LANDING_HEADING}`}>
            Ready to accelerate your team's workflow?
          </h2>
          
          <p className={`relative text-xs sm:text-sm max-w-xl mx-auto leading-relaxed ${LANDING_SUBTEXT}`}>
            Create your free workspace in under two minutes. No credit card required. Enjoy complete access to biometric setups, leave allowance logs, and status registries.
          </p>

          <div className="relative flex justify-center pt-2">
            <Link href="/signup">
              <button className={`inline-flex h-12 items-center justify-center rounded-2xl px-8 text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${brandBtnCta}`}>
                Launch ANSH HR Now
                <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2.5} />
              </button>
            </Link>
          </div>
        </div>
        </div>
      </section>

      {/* 8b. TRUST & COMPLIANCE */}
      <section className={`relative z-10 ${PAGE_SHELL}`}>
        <div className="mx-auto max-w-5xl">
          <TrustCompliance variant="landing" />
        </div>
      </section>

      {/* 9. GRAND SYMMETRICAL FOOTER */}
      <footer className={LANDING_FOOTER}>
        <div className={`${PAGE_SHELL} space-y-12`}>
          
          {/* Big Text Banner: Ansh Apps */}
          <div className="text-center select-none border-b border-zinc-200/80 pb-12 overflow-hidden dark:border-white/5">
            <span className={`text-[10px] font-black uppercase tracking-widest block mb-4 ${LANDING_MUTED}`}>HANDLED BY ANSH</span>
            <h1 className={`text-6xl sm:text-8xl md:text-[10rem] lg:text-[12rem] xl:text-[14rem] font-black ${brandGradientText} tracking-tighter opacity-95 leading-none py-4`}>
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
                <span className={`font-extrabold tracking-wider ${LANDING_BODY}`}>ANSH HR</span>
              </div>
              <p className={`text-[11px] leading-relaxed max-w-xs font-medium ${LANDING_MUTED}`}>
                The ultimate leave & attendance workspace designed for modern high-performance teams who scale natively.
              </p>
            </div>

            {/* Column 2 */}
            <div className="space-y-3">
              <h4 className={`text-[10px] font-bold uppercase tracking-widest ${LANDING_SUBTEXT}`}>Product</h4>
              <ul className={`space-y-2 ${LANDING_MUTED}`}>
                <li><a href="#punch" className="hover:text-violet-600 dark:hover:text-white transition-colors">Punch Clock</a></li>
                <li><a href="#leaves" className="hover:text-violet-600 dark:hover:text-white transition-colors">Leaves Gallery</a></li>
                <li><a href="#approvals" className="hover:text-violet-600 dark:hover:text-white transition-colors">Approvals Queue</a></li>
                <li><a href="#team" className="hover:text-violet-600 dark:hover:text-white transition-colors">Status Registry</a></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="space-y-3">
              <h4 className={`text-[10px] font-bold uppercase tracking-widest ${LANDING_SUBTEXT}`}>Account</h4>
              <ul className={`space-y-2 ${LANDING_MUTED}`}>
                <li><Link href="/login" className="hover:text-violet-600 dark:hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-violet-600 dark:hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link href="/onboarding" className="hover:text-violet-600 dark:hover:text-white transition-colors">Workspace Setup</Link></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div className="space-y-3">
              <h4 className={`text-[10px] font-bold uppercase tracking-widest ${LANDING_SUBTEXT}`}>Get In Touch</h4>
              <p className={`leading-normal text-[11px] font-medium ${LANDING_MUTED}`}>
                Have questions or need custom business plans? Talk to our creators.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <a
                  href="mailto:hello@anshapps.com"
                  className="flex items-center gap-2 text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-bold transition-colors"
                >
                  <Mail className="h-5 w-5 shrink-0" aria-hidden="true" />
                  hello@anshapps.com
                </a>
                <a
                  href="tel:+919625727372"
                  className="flex items-center gap-2 text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-bold transition-colors"
                >
                  <Phone className="h-5 w-5 shrink-0" aria-hidden="true" />
                  +91 9625727372
                </a>
                <a
                  href="https://wa.me/919625727372?text=Hi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-bold transition-colors"
                  aria-label="Chat on WhatsApp"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  +91 9625727372
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Row */}
          <div className="flex flex-col gap-6 border-t border-zinc-200/80 pt-8 sm:flex-row sm:items-center sm:justify-between dark:border-white/5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <span className={`text-[11px] font-medium ${LANDING_MUTED}`}>
                © 2026 ANSH HR. All rights reserved.
              </span>
              <MsmeBadge variant="landing" />
            </div>
            <div className={`flex gap-4.5 text-[11px] font-medium ${LANDING_MUTED}`}>
              <Link href="/privacy" className="hover:text-violet-600 dark:hover:text-slate-300 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-violet-600 dark:hover:text-slate-300 transition-colors">Terms & Conditions</Link>
              <a href="mailto:hello@anshapps.com" className="hover:text-violet-600 dark:hover:text-slate-300 transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
