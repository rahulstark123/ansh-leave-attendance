"use client";

import { Check, Moon, Palette, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import {
  accentThemes,
  type AccentTheme,
  type Appearance,
} from "@/config/themes";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface ThemeSwitcherProps {
  collapsed?: boolean;
}

const appearanceCards: {
  id: Appearance;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    id: "light",
    label: "Light",
    description: "Bright workspace for daytime",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Reduced glare for low light",
    icon: Moon,
  },
];

export function ThemeSwitcher({ collapsed }: ThemeSwitcherProps) {
  const appearance = useUiStore((s) => s.appearance);
  const accentTheme = useUiStore((s) => s.accentTheme);
  const setAppearance = useUiStore((s) => s.setAppearance);
  const setAccentTheme = useUiStore((s) => s.setAccentTheme);

  return (
    <Sheet>
      <SheetTrigger
        className={cn(
          "inline-flex h-10 w-full items-center justify-start gap-3 rounded-xl px-3 text-slate-500 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer",
          collapsed && "w-10 justify-center px-0"
        )}
      >
        <Palette className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <span className="text-xs font-bold uppercase tracking-widest">Theme Accent</span>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l border-border/50 bg-card p-0 sm:max-w-[400px] text-card-foreground"
      >
        <SheetHeader className="border-b border-border/50 bg-slate-50/50 px-6 py-6 text-left dark:bg-slate-900/50">
          <SheetTitle className="text-xl font-extrabold tracking-tight">
            Personalization
          </SheetTitle>
          <SheetDescription className="text-slate-500">
            Tailor your workspace appearance and color system for optimal focus.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Appearance
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {appearanceCards.map((opt) => {
                const Icon = opt.icon;
                const selected = appearance === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAppearance(opt.id)}
                    className={cn(
                      "relative flex flex-col items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-200 cursor-pointer",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-md shadow-primary/5"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50"
                    )}
                  >
                    {selected && (
                      <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                        <Check className="h-3.5 w-3.5" strokeWidth={4} />
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl shadow-inner",
                        selected
                          ? "bg-primary/20 text-primary"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <span className="block text-sm font-bold text-slate-900 dark:text-white">
                        {opt.label}
                      </span>
                      <span className="mt-1 block text-[11px] font-medium leading-relaxed text-slate-500">
                        {opt.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <Separator className="my-8 opacity-50" />

          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Accent color
            </h3>
            <p className="mt-1.5 text-xs font-medium text-slate-500">
              Sets the highlight tone for interactive elements and data viz.
            </p>
            <ul className="mt-4 space-y-3">
              {accentThemes.map((theme) => {
                const selected = accentTheme === theme.id;
                return (
                  <li key={theme.id}>
                    <button
                      type="button"
                      onClick={() => setAccentTheme(theme.id as AccentTheme)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-200 cursor-pointer",
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-md shadow-primary/5"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50"
                      )}
                    >
                      <span
                        className="h-10 w-10 shrink-0 rounded-xl shadow-inner ring-1 ring-black/5"
                        style={{ background: theme.swatch }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-slate-900 dark:text-white">
                          {theme.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                          {theme.description}
                        </span>
                      </span>
                      {selected && (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                          <Check className="h-3.5 w-3.5" strokeWidth={4} />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="mt-auto border-t border-border/50 bg-slate-50/50 px-6 py-6 dark:bg-slate-900/50">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
            System synced · Auto-save enabled
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
