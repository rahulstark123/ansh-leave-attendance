/**
 * Theme-aware landing page layout tokens — light by default, dark via `.dark` on `<html>`.
 * Uses the Ansh Landing Theme system (see ansh-landing-theme.ts for brand primitives).
 */

// ── PAGE WRAPPER ──

export const LANDING_PAGE =
  "min-h-screen overflow-x-hidden bg-zinc-50 font-sans text-zinc-900 selection:bg-violet-500/20 selection:text-violet-700 dark:bg-zinc-950 dark:text-zinc-100 dark:selection:text-violet-400";

// ── HEADER ──

export const LANDING_HEADER =
  "sticky top-0 z-50 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200/50 dark:bg-zinc-950/80 dark:border-zinc-800/50";

// ── SECTIONS ──

export const LANDING_SECTION =
  "relative z-10 border-t border-zinc-200/50 bg-zinc-100/40 py-24 dark:border-zinc-800/40 dark:bg-zinc-950/20";

export const LANDING_SECTION_CLEAR =
  "relative z-10 border-t border-zinc-200/50 py-24 dark:border-zinc-800/40";

export const LANDING_SECTION_ALT =
  "relative z-10 border-t border-zinc-200/50 bg-zinc-50/50 py-20 overflow-hidden dark:border-zinc-800/40 dark:bg-zinc-950/20";

// ── FOOTER ──

export const LANDING_FOOTER =
  "relative z-10 border-t border-zinc-200/50 bg-zinc-50 pt-20 pb-10 dark:border-zinc-800/40 dark:bg-zinc-950";

// ── CARDS ──

export const LANDING_CARD =
  "rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm hover:border-blue-500/30 transition-all group dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:shadow-none dark:hover:border-violet-500/20";

export const LANDING_SURFACE =
  "rounded-3xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:shadow-none";

export const LANDING_PANEL =
  "rounded-3xl border border-zinc-200/80 bg-white p-8 shadow-sm hover:border-blue-500/30 transition-all group dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:shadow-none dark:hover:border-violet-500/20";

export const LANDING_PRICING_CARD =
  "rounded-3xl border border-zinc-200/80 bg-white p-8 flex flex-col justify-between space-y-6 relative shadow-sm hover:border-blue-500/30 transition-all dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:shadow-none dark:hover:border-violet-500/20";

export const LANDING_COMPARISON_CARD =
  "rounded-2xl border border-zinc-200/80 bg-white p-6 space-y-4 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:shadow-none";

export const LANDING_FAQ_ITEM =
  "rounded-2xl border border-zinc-200/80 bg-white overflow-hidden transition-colors duration-200 dark:border-zinc-800/60 dark:bg-zinc-900/60";

export const LANDING_CTA_CARD =
  "rounded-3xl border border-zinc-200/80 bg-white p-10 text-center relative overflow-hidden space-y-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:shadow-none";

// ── MARQUEE (CAROUSEL) ──

export const LANDING_MARQUEE_FADE_LEFT =
  "absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-zinc-50 to-transparent z-10 pointer-events-none dark:from-zinc-950";

export const LANDING_MARQUEE_FADE_RIGHT =
  "absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-zinc-50 to-transparent z-10 pointer-events-none dark:from-zinc-950";

export const LANDING_MARQUEE_CARD =
  "group relative flex flex-col justify-between w-72 shrink-0 rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-md space-y-4 transition-all duration-300 dark:border-zinc-800/60 dark:bg-zinc-900/85 dark:shadow-none";

// ── TYPOGRAPHY ──

export const LANDING_HEADING = "text-zinc-900 dark:text-white";

export const LANDING_SUBTEXT = "text-zinc-700 dark:text-zinc-300";

export const LANDING_MUTED = "text-zinc-600 dark:text-zinc-400";

export const LANDING_BODY = "text-zinc-800 dark:text-zinc-100";

// ── NAVIGATION ──

export const LANDING_NAV =
  "hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400";

export const LANDING_NAV_LINK = "hover:text-violet-600 dark:hover:text-violet-400 transition-colors";

export const LANDING_SIGN_IN_BTN =
  "inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98] transition-all cursor-pointer dark:border-zinc-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white";

// ── GRID OVERLAY ──

export const LANDING_GRID_OVERLAY =
  "absolute inset-0 opacity-[0.035] pointer-events-none dark:opacity-[0.02]";

export const LANDING_GRID_BG =
  "linear-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.06) 1px, transparent 1px)";

export const LANDING_GRID_BG_DARK =
  "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)";
