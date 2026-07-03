/**
 * ANSH Landing Page Theme System
 *
 * Reusable across all Ansh Apps projects.
 * Requires Tailwind CSS with `dark` class strategy.
 */

// ── BRAND COLORS ──

export const BRAND = {
  blue: "#00c6ff",
  violet: "#7000ff",
  pink: "#e040fb",
  solidBlue: "#0078FF",
  solidViolet: "#9333ea",
} as const;

// ── GRADIENTS ──

export const BRAND_GRADIENT_TEXT =
  "bg-gradient-to-r from-[#00c6ff] via-[#7000ff] to-[#e040fb] bg-clip-text text-transparent dark:from-[#4dc4ff] dark:via-[#8b5cf6] dark:to-[#e879f9]";

export const BTN_PRIMARY =
  "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg shadow-violet-600/25";

export const BTN_CTA =
  "bg-gradient-to-r from-[#00c6ff] to-[#9333ea] hover:from-[#00b4ea] hover:to-[#7c22d4] text-white shadow-lg shadow-violet-500/25";

// ── PAGE BASE ──

export const PAGE_BG = "bg-zinc-50 dark:bg-zinc-950";

// ── AMBIENT GLOW (render inside a pointer-events-none absolute inset-0 wrapper) ──

export const GLOW_BLUE =
  "absolute -top-[30%] -left-[10%] h-[70%] w-[50%] rounded-full bg-[#00c6ff]/10 blur-[120px] dark:bg-[#00c6ff]/5";

export const GLOW_VIOLET =
  "absolute top-[20%] -right-[10%] h-[60%] w-[40%] rounded-full bg-[#7000ff]/10 blur-[100px] dark:bg-[#7000ff]/5";

export const GLOW_PINK =
  "absolute bottom-[10%] left-[20%] h-[50%] w-[50%] rounded-full bg-[#e040fb]/10 blur-[130px] dark:bg-[#e040fb]/5";

// ── SECTION BACKGROUNDS ──

export const SECTION_TINT = "bg-zinc-100/40 dark:bg-zinc-950/20";

export const SECTION_BORDER = "border-t border-zinc-200/50 dark:border-zinc-800/40";

// ── HEADER ──

export const HEADER_BG =
  "bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200/50 dark:bg-zinc-950/80 dark:border-zinc-800/50";

// ── CARDS ──

export const CARD =
  "bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60";

export const CARD_HOVER = "hover:border-blue-500/30 dark:hover:border-violet-500/20";

// ── CTA SECTION (dark block) ──

export const CTA_BG = "bg-zinc-900 text-white overflow-hidden relative";

export const CTA_GRADIENT_OVERLAY =
  "absolute inset-0 bg-gradient-to-br from-[#0078ff]/10 via-[#7000ff]/10 to-[#e040fb]/10";

export const CTA_ORB_VIOLET =
  "absolute top-[10%] left-[20%] w-[300px] h-[300px] rounded-full bg-[#7000ff]/10 blur-[80px]";

export const CTA_ORB_BLUE =
  "absolute bottom-[5%] right-[15%] w-[250px] h-[250px] rounded-full bg-[#00c6ff]/10 blur-[70px]";

// ── CAROUSEL EDGE FADES ──

export const CAROUSEL_FADE_LEFT =
  "absolute top-0 left-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-zinc-50 to-transparent dark:from-zinc-950 z-10 pointer-events-none";

export const CAROUSEL_FADE_RIGHT =
  "absolute top-0 right-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-zinc-50 to-transparent dark:from-zinc-950 z-10 pointer-events-none";

// ── MOCKUP GLOWS ──

export const GLOW_HERO_MOCKUP =
  "absolute inset-0 bg-violet-500/10 rounded-3xl blur-2xl transform rotate-2";

export const GLOW_FEATURE_MOCKUP =
  "absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-violet-500/10 to-indigo-500/10 rounded-2xl blur-3xl";

// ── ICON / AVATAR CHIP ──

export const AVATAR_GRADIENT = "bg-gradient-to-br from-blue-600 to-violet-600 text-white";

// ── BADGES ──

export const ICON_BADGE = "bg-blue-500/10 text-blue-600 dark:text-violet-400";

export const PILL_BADGE =
  "bg-blue-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400";

// ── HIGHLIGHTED PRICING CARD ──

export const PRICING_HIGHLIGHT =
  "bg-zinc-900 border-violet-500/30 text-white dark:bg-zinc-900/80";
