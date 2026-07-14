"use client";

import Link from "next/link";
import { GatedNavLink } from "@/components/billing/gated-nav-link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  PanelLeftClose,
  PanelLeft,
  HelpCircle,
  LayoutGrid,
  ExternalLink,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNav, getSectionFromPath } from "@/config/navigation";
import { useUiStore } from "@/stores/ui-store";
import { useLeaveStore } from "@/stores/leave-store";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ANSH_ECOSYSTEM_APPS } from "@/lib/ansh-ecosystem-apps";

export function MainSidebar() {
  const pathname = usePathname();
  const activeSection = getSectionFromPath(pathname);
  const isHelpActive = pathname === "/help" || pathname.startsWith("/help/");
  const { mainSidebarCollapsed, setMainSidebarCollapsed, toggleMainSidebar } = useUiStore();
  const { currentUser } = useLeaveStore();

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
      <div className="flex h-16 shrink-0 items-center gap-1.5 px-4 border-b border-border/50">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          <img
            src="/logoAnshapps.png"
            alt="Ansh Apps Logo"
            className="h-10 w-10 object-contain"
          />
        </div>
        {!mainSidebarCollapsed && (
          <div className="min-w-0 animate-in fade-in duration-300">
            <p className="truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
              Ansh HR
            </p>
          </div>
        )}
      </div>

      <nav className="sidebar-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-6">
        {mainNav.map((item) => {
          if (item.id === "reports") {
            const isAllowed = 
              currentUser?.role === "Admin" ||
              currentUser?.role === "Owner" ||
              currentUser?.role === "HR Manager" ||
              currentUser?.role === "Manager";
            if (!isAllowed) return null;
          }
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          const linkClassName = cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-semibold transition-all duration-200",
            isActive
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          );
          const linkTitle = mainSidebarCollapsed ? item.label : undefined;
          const linkContent = (
            <>
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                )}
                aria-hidden
              />
              {!mainSidebarCollapsed && <span>{item.label}</span>}
            </>
          );

          if (item.id === "reports" || item.id === "workspace") {
            return (
              <GatedNavLink
                key={item.id}
                href={item.href}
                featureId={item.id === "reports" ? "reports" : "team-space"}
                className={linkClassName}
                title={linkTitle}
              >
                {linkContent}
              </GatedNavLink>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={linkClassName}
              title={linkTitle}
            >
              {linkContent}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-border/50 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "group inline-flex h-10 w-full items-center justify-start gap-3 rounded-xl px-3 transition-all outline-none text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer",
              mainSidebarCollapsed && "justify-center px-0"
            )}
            title={mainSidebarCollapsed ? "ANSH Apps" : undefined}
          >
            <LayoutGrid className="h-5 w-5 shrink-0 text-slate-500" />
            {!mainSidebarCollapsed && (
              <>
                <span className="flex-1 text-left text-xs font-bold uppercase tracking-widest">
                  ANSH Apps
                </span>
                <ChevronUp className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align={mainSidebarCollapsed ? "center" : "start"}
            sideOffset={8}
            className="sidebar-scroll w-[280px] max-h-[min(70vh,420px)] overflow-y-auto p-2 bg-card/95 dark:bg-slate-950/95 shadow-2xl backdrop-blur-md border border-border"
          >
            <div className="px-2 py-1.5 mb-1 border-b border-border/40">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                ANSH Ecosystem
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                Jump to your other ANSH apps
              </p>
            </div>
            <div className="space-y-0.5">
              {ANSH_ECOSYSTEM_APPS.map((app) => {
                const isCurrent = app.status === "CURRENT";
                return (
                  <a
                    key={app.name}
                    href={app.link}
                    target={isCurrent ? undefined : "_blank"}
                    rel={isCurrent ? undefined : "noopener noreferrer"}
                    className={cn(
                      "flex items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors outline-none",
                      isCurrent
                        ? "bg-primary/10 cursor-default"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
                    )}
                  >
                    <span
                      className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", app.dotColor)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-bold text-slate-800 dark:text-white">
                          {app.name}
                        </span>
                        {!isCurrent && app.isLive && (
                          <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                        )}
                      </div>
                      <p className="truncate text-[10px] font-medium text-slate-500">
                        {app.subtitle}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider",
                        app.badgeColor
                      )}
                    >
                      {app.status === "BUILDING"
                        ? "Soon"
                        : app.status === "CURRENT"
                          ? "Here"
                          : "Live"}
                    </span>
                  </a>
                );
              })}
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-border/40 px-1">
              <a
                href="https://anshapps.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 transition-colors"
              >
                Visit anshapps.com
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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
