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
} from "lucide-react";

export default function LandingPage() {
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem("ansh_auth_session");
    if (session === "true") {
      setSessionActive(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Dynamic Background Accents */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[150px]" />
        <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-sky-500/5 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* TOP HEADER */}
      <header className="relative z-10 mx-auto max-w-7xl px-6 h-20 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/10">
            <img
              src="/logoAnshapps.png"
              alt="Ansh Apps Logo"
              className="h-9 w-9 object-contain"
            />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wider uppercase text-white block">
              Ansh
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block -mt-0.5">
              Leave & Attendance
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-400">
          <a href="#punch" className="hover:text-white transition-colors">Punch Clock</a>
          <a href="#leaves" className="hover:text-white transition-colors">Leaves Manager</a>
          <a href="#approvals" className="hover:text-white transition-colors">Approvals</a>
          <a href="#team" className="hover:text-white transition-colors">Directory</a>
          <a href="#reports" className="hover:text-white transition-colors">Insights</a>
        </nav>

        <div className="flex items-center gap-4">
          {sessionActive ? (
            <Link href="/dashboard" id="hdr-dash-btn">
              <button className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-500 px-5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/45 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                Go to Dashboard
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </Link>
          ) : (
            <Link href="/login" id="hdr-login-btn">
              <button className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all cursor-pointer">
                Sign In to ANSH HR
              </button>
            </Link>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-28 text-center space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">
            Next-Gen HR Operations
          </span>
        </div>

        <h1 className="max-w-4xl mx-auto font-sans text-5xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
          State-of-the-Art{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
            Leave & Attendance
          </span>{" "}
          Workspace
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
          Focus on what actually matters. Let Ansh seamlessly manage employee shift hours, dynamic allowances, instant approvals, and organizational directory statuses beautifully.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/login" id="hero-get-started">
            <button className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-2xl bg-emerald-500 px-8 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/15 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
              Launch ANSH HR
              <Play className="ml-2 h-4 w-4 fill-current" />
            </button>
          </Link>
          <a href="#features" className="w-full sm:w-auto">
            <button className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 text-sm font-bold text-slate-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
              Explore Products
            </button>
          </a>
        </div>
      </section>

      {/* PRODUCTS / SECTIONS LIST */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-12 space-y-32">
        
        {/* SECTION 1: ATTENDANCE PUNCH CLOCK */}
        <div id="punch" className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20 text-emerald-400">
              <Clock className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Attendance Clock</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Punch In. Start Shift. Watch it tick.
            </h2>
            <p className="text-slate-400 leading-relaxed text-[15px]">
              Tired of static sheets? Our interactive Punch widget calculates your active shift length down to the second with a **live ticking timer** inside your browser dashboard.
            </p>
            <ul className="space-y-3.5 text-sm text-slate-300 font-semibold">
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                Single-click punch check-in and check-out logs.
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                Automatic punctuality tagging (Grace checks before 10:00 AM).
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                Preserved localStorage shift sessions to avoid data loss.
              </li>
            </ul>
          </div>
          
          <div className="relative rounded-3xl border border-white/5 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl" />
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6">
              Active Shift Simulation
            </span>
            <div className="rounded-2xl bg-slate-950 p-6 border border-white/5 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-bold text-slate-400">LOGGED WORK DATE</span>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  On-time check
                </span>
              </div>
              <div className="flex flex-col items-center justify-center py-4">
                <span className="font-mono text-4xl font-black text-white tracking-widest">
                  08:14:52
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mt-2">
                  Shift duration active
                </span>
              </div>
              <button className="w-full h-11 bg-rose-500 text-white rounded-xl text-xs font-extrabold tracking-wider uppercase shadow-lg shadow-rose-500/10">
                PUNCH OUT SHIFT
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: LEAVE & BALANCE MANAGER */}
        <div id="leaves" className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-xl bg-sky-500/10 px-3 py-1.5 border border-sky-500/20 text-sky-400">
              <CalendarDays className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Leave Allowances</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Track remaining allowances & Apply instantly
            </h2>
            <p className="text-slate-400 leading-relaxed text-[15px]">
              Ditch manual leave applications. Display remaining balances in real-time and leverage dynamic forms with comprehensive date selections and validations.
            </p>
            <ul className="space-y-3.5 text-sm text-slate-300 font-semibold">
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-sky-400 shrink-0" />
                Live Annual, Sick, and Casual leave pools remaining.
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-sky-400 shrink-0" />
                Base UI Dialog overlays with automated date selectors.
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-sky-400 shrink-0" />
                Half-day vs. Full-day checkbox shift allowances.
              </li>
            </ul>
          </div>

          <div className="relative rounded-3xl border border-white/5 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md group hover:border-sky-500/20 transition-all duration-300">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6">
              Allowance Pool Ratios
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 rounded-xl p-4 border border-white/5 text-center">
                <span className="block text-2xl font-black text-emerald-400">14</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Annual</span>
              </div>
              <div className="bg-slate-950 rounded-xl p-4 border border-white/5 text-center">
                <span className="block text-2xl font-black text-sky-400">7</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Sick</span>
              </div>
              <div className="bg-slate-950 rounded-xl p-4 border border-white/5 text-center">
                <span className="block text-2xl font-black text-purple-400">6</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Casual</span>
              </div>
            </div>
            <div className="mt-5 rounded-xl bg-slate-950 border border-white/5 p-4 flex justify-between items-center text-xs">
              <div>
                <span className="block font-bold text-slate-200">Extended trip to Himachal</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Annual Category · 3 Days</span>
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full">
                Pending Review
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: MANAGER APPROVALS */}
        <div id="approvals" className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-xl bg-purple-500/10 px-3 py-1.5 border border-purple-500/20 text-purple-400">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Manager Approvals</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Real-time approvals queue with strict role guards
            </h2>
            <p className="text-slate-400 leading-relaxed text-[15px]">
              Authorize manager privileges instantly. The Approvals dashboard permits HR Managers and Admins to approve/reject requests, and restricts normal employee accounts via premium glassmorphic access locks.
            </p>
            <ul className="space-y-3.5 text-sm text-slate-300 font-semibold">
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-purple-400 shrink-0" />
                Live status filters: Pending, Approved, and Rejected loops.
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-purple-400 shrink-0" />
                Automatic employee leave pool deductions upon approvals.
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-purple-400 shrink-0" />
                Interactive user switching to test both roles effortlessly.
              </li>
            </ul>
          </div>

          <div className="relative rounded-3xl border border-white/5 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md group hover:border-purple-500/20 transition-all duration-300">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6">
              Manager approvals card
            </span>
            <div className="rounded-2xl bg-slate-950 border border-white/5 p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="block font-bold text-slate-200 text-sm">Priya Sharma</span>
                  <span className="block text-[10px] text-slate-500">Software Engineer</span>
                </div>
                <span className="text-[9px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                  Annual Leave
                </span>
              </div>
              <p className="text-xs text-slate-400 italic">"Dental checkup & minor surgery"</p>
              <div className="flex gap-2 pt-1.5">
                <button className="flex-1 h-9 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:scale-[1.02] transition-all">
                  Approve
                </button>
                <button className="flex-1 h-9 bg-white/5 text-slate-300 font-bold text-xs rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: ORGANIZATIONAL DIRECTORY */}
        <div id="team" className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5 border border-amber-500/20 text-amber-400">
              <Users2 className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Organizational Directory</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Search. Filter. Inspect status directories.
            </h2>
            <p className="text-slate-400 leading-relaxed text-[15px]">
              Instantly review who is actively logged-in, who is on half-day, or who is currently out of office. Renders sleek visual employee registries and allowance pools.
            </p>
            <ul className="space-y-3.5 text-sm text-slate-300 font-semibold">
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                Real-time active status badges (Active, On Leave, Half-day).
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                Sleek organizational search bar filter systems.
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                Quick-inspect remaining leave allowances of team members.
              </li>
            </ul>
          </div>

          <div className="relative rounded-3xl border border-white/5 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md group hover:border-amber-500/20 transition-all duration-300">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6">
              Status Registry Mock
            </span>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 rounded-xl p-3.5 border border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-black">
                    RR
                  </div>
                  <div>
                    <span className="block font-bold text-slate-200">Rahul Raj</span>
                    <span className="block text-[10px] text-slate-500">HR Manager</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <div className="bg-slate-950 rounded-xl p-3.5 border border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 font-black">
                    AP
                  </div>
                  <div>
                    <span className="block font-bold text-slate-200">Amit Patel</span>
                    <span className="block text-[10px] text-slate-500">Designer</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                  On Leave
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: ANALYTICS & INSIGHTS */}
        <div id="reports" className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-1.5 border border-rose-500/20 text-rose-400">
              <BarChart4 className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Reports & Analytics</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Track resource indices & availability rate trends
            </h2>
            <p className="text-slate-400 leading-relaxed text-[15px]">
              Gather high-quality organizational data metrics. Beautiful visual progress bars display total leave category ratios and department punctuality index scores dynamically.
            </p>
            <ul className="space-y-3.5 text-sm text-slate-300 font-semibold">
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-rose-400 shrink-0" />
                Live cumulative resource availability charts.
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-rose-400 shrink-0" />
                Leave category percentage breakdowns (Annual, Sick, Casual).
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-rose-400 shrink-0" />
                Department specific punctuality ratios.
              </li>
            </ul>
          </div>

          <div className="relative rounded-3xl border border-white/5 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md group hover:border-rose-500/20 transition-all duration-300">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6">
              Department Attendance Rate
            </span>
            <div className="rounded-2xl bg-slate-950 border border-white/5 p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-350">
                  <span>Engineering</span>
                  <span>96%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "96%" }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-350">
                  <span>Product Design</span>
                  <span>92%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: "92%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* FOOTER */}
      <footer className="relative z-10 mx-auto max-w-7xl px-6 py-16 border-t border-white/5 text-center text-xs text-slate-500 space-y-4">
        <div className="flex justify-center gap-8 font-bold uppercase tracking-wider text-slate-400 mb-4">
          <Link href="/login" className="hover:text-white transition-colors">Sign in to ANSH HR</Link>
          <Link href="/signup" className="hover:text-white transition-colors">Register Workspace</Link>
        </div>
        <p>© 2026 ANSH Leave & Attendance. Crafted for modern high-performance workspace teams.</p>
      </footer>
    </div>
  );
}
