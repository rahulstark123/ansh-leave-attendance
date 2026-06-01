"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { PanelLeftClose, PanelLeft, Calendar, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNav, getSectionFromPath } from "@/config/navigation";
import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";

export function MainSidebar() {
  const pathname = usePathname();
  const activeSection = getSectionFromPath(pathname);
  const isHelpActive = pathname === "/help";
  const { mainSidebarCollapsed, setMainSidebarCollapsed, toggleMainSidebar } = useUiStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1499px)");

    const handleScreenSizeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setMainSidebarCollapsed(true);
      } else {
        setMainSidebarCollapsed(false);
      }
    };

    handleScreenSizeChange(mediaQuery);

    mediaQuery.addEventListener("change", handleScreenSizeChange);
    return () => mediaQuery.removeEventListener("change", handleScreenSizeChange);
  }, [setMainSidebarCollapsed]);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card transition-[width] duration-300 ease-out shadow-sm",
        mainSidebarCollapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border/50">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 shadow-md">
          <img
            src="/logoAnshapps.png"
            alt="Ansh Apps Logo"
            className="h-8 w-8 object-contain"
          />
        </div>
        {!mainSidebarCollapsed && (
          <div className="min-w-0 animate-in fade-in duration-300">
            <p className="truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
              Ansh HR
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
              Leave & Attendance
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-6">
        {mainNav.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-semibold transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              )}
              title={mainSidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                )}
                aria-hidden
              />
              {!mainSidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-border/50 p-3">
        <Link
          href="/help"
          className={cn(
            "group inline-flex h-10 w-full items-center justify-start gap-3 rounded-xl px-3 transition-all outline-none",
            isHelpActive
              ? "bg-primary/10 text-primary"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
            mainSidebarCollapsed && "justify-center px-0"
          )}
        >
          <HelpCircle className={cn("h-5 w-5 shrink-0", isHelpActive ? "text-primary" : "text-slate-500")} />
          {!mainSidebarCollapsed && (
            <span className="text-xs font-bold uppercase tracking-widest">Help Center</span>
          )}
        </Link>
        <ThemeSwitcher collapsed={mainSidebarCollapsed} />
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-full justify-start gap-3 rounded-xl px-3 text-slate-500 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          onClick={toggleMainSidebar}
        >
          {mainSidebarCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Collapse Nav
              </span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
