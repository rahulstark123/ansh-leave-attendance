"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";

export function LogoutOverlay() {
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fill up the bar over 1200ms
    const startTime = Date.now();
    const duration = 1200;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (elapsed < duration) {
        requestAnimationFrame(updateProgress);
      }
    };

    const frameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(frameId);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl transition-all duration-300 animate-in fade-in">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300 select-none">
        {/* Glow ambient background details */}
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Outer Pulsing Glow */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 ring-4 ring-rose-500/5 animate-pulse">
          <LogOut className="h-8 w-8 animate-bounce duration-1000" />
        </div>

        <h3 className="text-lg font-black tracking-tight text-white uppercase">
          Logging you out
        </h3>
        <p className="mt-2 text-xs font-medium text-slate-400">
          Securing your workspace and clearing session data...
        </p>

        {/* Elegant gradient progress bar */}
        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
