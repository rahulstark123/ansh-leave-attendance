"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, LogOut, User, Calendar, Clock, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useGlobalSearchStore } from "@/stores/global-search-store";
import { useLeaveStore } from "@/stores/leave-store";
import { usePlanStore } from "@/stores/plan-store";
import { useIsMac } from "@/hooks/use-is-mac";
import { cn } from "@/lib/utils";
import { LogoutOverlay } from "./logout-overlay";

export function AppHeader() {
  const isMac = useIsMac();
  const router = useRouter();
  const setSearchOpen = useGlobalSearchStore((s) => s.setOpen);
  const { currentUser } = useLeaveStore();
  const planLoaded = usePlanStore((s) => s.loaded);
  const hasProAccess = usePlanStore((s) => s.hasProAccess);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<any>(null);

  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsOpen(false);
    }, 150);
    setHoverTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Let the smooth progress animation play out for a premium experience
    await new Promise((resolve) => setTimeout(resolve, 1300));
    const { supabase } = await import("@/lib/supabase/client");
    await supabase.auth.signOut();
    localStorage.removeItem("ansh-leave-database");
    sessionStorage.removeItem("ansh_auth_session");
    sessionStorage.removeItem("ansh_auth_token");
    sessionStorage.removeItem("ansh_impersonate_user_id");
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl gap-4">
      {/* Global Search Trigger */}
      <button
        type="button"
        id="global-search-btn"
        onClick={() => setSearchOpen(true)}
        className="relative flex w-full max-w-sm items-center rounded-xl border border-slate-200 bg-slate-50/50 text-left transition-all hover:border-primary/40 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900 cursor-pointer"
        aria-label="Open search"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <span className="h-10 w-full truncate py-2.5 pl-11 pr-20 text-sm text-slate-500 dark:text-slate-400">
          Search everything…
        </span>
        <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 gap-1 sm:flex">
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800">
            {isMac ? "⌘" : "Ctrl"}
          </kbd>
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800">
            K
          </kbd>
        </div>
      </button>

      <div className="flex-1" />

      <div className="flex shrink-0 items-center gap-3">
        {planLoaded && (
          <Link
            href="/settings/billing"
            className={cn(
              "hidden sm:inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest transition-colors hover:opacity-90",
              hasProAccess
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            )}
            title="View billing & plan"
          >
            {hasProAccess ? "PRO" : "FREE"}
          </Link>
        )}
        {/* User switcher & Shortcuts dropdown */}
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary text-[11px] font-bold text-primary-foreground">
                {currentUser.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 flex-col text-left sm:flex">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white max-w-[120px]">
                {currentUser.name}
              </p>
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-primary">
                {currentUser.role}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            sideOffset={8} 
            className="w-56 bg-card/95 dark:bg-slate-950/95 shadow-2xl backdrop-blur-md border border-border dark:border-slate-800 p-1.5 space-y-0.5 select-none animate-in fade-in slide-in-from-top-1 duration-150"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* User Details info */}
            <div className="px-2.5 py-2 flex items-center gap-2.5 border-b border-border/40 mb-1">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground">
                {currentUser.avatarInitials}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {currentUser.name}
                </span>
                <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-primary leading-none mt-0.5">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2.5 py-1 block">
                Shortcuts
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push("/settings/profile")}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer outline-none"
              >
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-semibold">My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/leave")}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer outline-none"
              >
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-semibold">Leave Requests</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/attendance")}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer outline-none"
              >
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-semibold">Attendance Logs</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/settings/profile")}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer outline-none"
              >
                <Settings className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-semibold">Account Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-border/40 dark:bg-slate-800/50 my-1" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-all text-rose-500 hover:bg-rose-500/10 cursor-pointer outline-none font-bold"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Log out Session</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Standalone Logout Button */}
        <Button
          variant="ghost"
          size="icon"
          id="navbar-logout-btn"
          onClick={handleLogout}
          className="h-10 w-10 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 dark:text-slate-400 dark:hover:bg-rose-950/30 transition-colors"
          title="Log out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Premium logout transition overlay */}
      {isLoggingOut && <LogoutOverlay />}
    </header>
  );
}
