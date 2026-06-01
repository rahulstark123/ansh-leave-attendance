"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  CalendarRange,
  Users,
  CheckCircle2,
  CalendarDays,
  UserCheck,
  AlertCircle,
} from "lucide-react";

interface SlideData {
  id: number;
  badge: string;
  badgeIcon: typeof Clock;
  badgeColor: string;
  badgeBg: string;
  title: React.ReactNode;
  copy: string;
}

const SLIDES: SlideData[] = [
  {
    id: 0,
    badge: "Smart Shift Tracking",
    badgeIcon: Clock,
    badgeColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 border-emerald-500/20",
    title: (
      <>
        Track your
        <br />
        <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          Work Attendance
        </span>
        <br />
        <span className="text-slate-200">effortlessly</span>
      </>
    ),
    copy: "Punch in and check out in a single click. Keep tabs on your working hours, active shift timers, and monthly attendance statistics dynamically.",
  },
  {
    id: 1,
    badge: "Instant Time-off",
    badgeIcon: CalendarRange,
    badgeColor: "text-sky-400",
    badgeBg: "bg-sky-500/10 border-sky-500/20",
    title: (
      <>
        Apply for
        <br />
        <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          Leave Allowances
        </span>
        <br />
        <span className="text-indigo-400">instantly</span>
      </>
    ),
    copy: "Submit time-off requests, check your remaining annual, sick, or casual allowances, and receive manager approvals in real time.",
  },
  {
    id: 2,
    badge: "Team Directory",
    badgeIcon: Users,
    badgeColor: "text-purple-400",
    badgeBg: "bg-purple-500/10 border-purple-500/20",
    title: (
      <>
        Monitor your
        <br />
        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Team Availability
        </span>
        <br />
        <span className="text-pink-500">beautifully</span>
      </>
    ),
    copy: "Check daily team attendance rate, active out-of-office registries, and employee availability status records instantly from your org directory.",
  },
];

export function AuthMarketingPanel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];
  const BadgeIcon = slide.badgeIcon;

  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#070809] lg:flex border-r border-slate-900/50 min-h-screen">
      {/* Dynamic Mesh Gradients behind elements for modern premium feel */}
      <div className="absolute inset-0 z-0">
        {/* Sleek matrix grid background */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow point matching slide theme */}
        <div
          className="absolute -left-20 top-1/4 h-[350px] w-[350px] rounded-full blur-[140px] opacity-25 transition-all duration-1000"
          style={{
            backgroundColor:
              currentSlide === 0
                ? "var(--color-primary)"
                : currentSlide === 1
                ? "#0ea5e9"
                : "#a855f7",
          }}
        />
      </div>

      <div className="relative z-10 flex h-full flex-col p-12 xl:p-20 justify-between">
        {/* Slide Copy Area */}
        <div className="space-y-6">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-md transition-all duration-500 ${slide.badgeBg}`}
          >
            <BadgeIcon className={`h-4 w-4 ${slide.badgeColor}`} />
            <span className="text-xs font-bold tracking-wide text-slate-300">
              {slide.badge}
            </span>
          </div>

          <h1 className="mt-8 font-sans text-4xl font-extrabold leading-[1.1] tracking-tight text-white xl:text-5xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            {slide.title}
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-400 transition-all duration-500 animate-in fade-in delay-150">
            {slide.copy}
          </p>
        </div>

        {/* Visual Mockups Container */}
        <div className="relative w-full h-[280px] flex items-center justify-center my-6">
          {/* SLIDE 0 VISUAL: ACTIVE SHIFT CLOCK */}
          {currentSlide === 0 && (
            <div className="absolute w-[320px] rounded-2xl border border-white/5 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 h-16 w-16 rounded-full bg-emerald-500/10 blur-xl" />
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Attendance Clock
                    </span>
                    <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">
                      Shift Started: 09:00 AM
                    </span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Active
                </div>
              </div>

              <div className="mt-5 text-center">
                <span className="font-mono text-3xl font-extrabold text-white tracking-wider">
                  06:45:12
                </span>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                  Logged Shift Duration
                </span>
              </div>

              <div className="mt-5 flex gap-2">
                <div className="flex-1 rounded-xl bg-white/5 border border-white/5 p-2 text-center">
                  <span className="block text-[10px] text-slate-400">On-time</span>
                  <span className="block text-xs font-extrabold text-slate-200 mt-0.5">Yes</span>
                </div>
                <div className="flex-1 rounded-xl bg-white/5 border border-white/5 p-2 text-center">
                  <span className="block text-[10px] text-slate-400">Status</span>
                  <span className="block text-xs font-extrabold text-emerald-400 mt-0.5">Healthy</span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 1 VISUAL: Priya's Leave Status Request Bubble */}
          {currentSlide === 1 && (
            <div className="absolute w-[340px] rounded-2xl border border-white/5 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-xs font-extrabold text-white shadow-lg shadow-sky-500/10">
                  PS
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Priya Sharma</span>
                      <span className="text-[9px] text-slate-500 font-semibold">9:45 AM</span>
                    </div>
                    <span className="block text-[10px] font-semibold text-sky-400 mt-0.5">
                      Annual Leave · 3 Days
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 bg-white/5 border border-white/5 p-3 rounded-xl leading-relaxed italic">
                    "Requesting three days of paid time off for an extended weekend family trip."
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Approval Queue</span>
                    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/10">
                      <CheckCircle2 className="h-3 w-3" />
                      Approved
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2 VISUAL: TEAM AVAILABILITY REGISTER */}
          {currentSlide === 2 && (
            <div className="absolute w-[320px] rounded-2xl border border-white/5 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-white/5 pb-2.5">
                Active Resource Availability (Today)
              </span>

              <div className="mt-3.5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-extrabold text-[10px]">
                      RR
                    </div>
                    <div>
                      <span className="block font-bold text-slate-200">Rahul Raj</span>
                      <span className="block text-[9px] text-slate-500">HR Manager</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                    Active
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 font-extrabold text-[10px]">
                      AP
                    </div>
                    <div>
                      <span className="block font-bold text-slate-200">Amit Patel</span>
                      <span className="block text-[9px] text-slate-500">Product Designer</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[9px] font-bold text-sky-400">
                    On Leave
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 font-extrabold text-[10px]">
                      SR
                    </div>
                    <div>
                      <span className="block font-bold text-slate-200">Sneha Reddy</span>
                      <span className="block text-[9px] text-slate-500">Data Analyst</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                    Half-day
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Slide Indicators Navigation */}
        <div className="flex gap-2">
          {SLIDES.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentSlide === index
                  ? "w-8 bg-emerald-500"
                  : "w-4 bg-white/10 hover:bg-white/30"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
