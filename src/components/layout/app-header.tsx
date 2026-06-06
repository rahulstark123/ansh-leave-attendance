"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, ChevronDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGlobalSearchStore } from "@/stores/global-search-store";
import { useLeaveStore } from "@/stores/leave-store";
import { useIsMac } from "@/hooks/use-is-mac";
import { cn } from "@/lib/utils";
import { LogoutOverlay } from "./logout-overlay";

export function AppHeader() {
  const isMac = useIsMac();
  const router = useRouter();
  const setSearchOpen = useGlobalSearchStore((s) => s.setOpen);
  const { currentUser, employees, switchUser, leaves } = useLeaveStore();
  const pendingCount = leaves.filter((l) => l.status === "Pending").length;
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Let the smooth progress animation play out for a premium experience
    await new Promise((resolve) => setTimeout(resolve, 1300));
    const { supabase } = await import("@/lib/supabase/client");
    await supabase.auth.signOut();
    sessionStorage.removeItem("ansh_auth_session");
    sessionStorage.removeItem("ansh_auth_token");
    router.push("/login");
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
        {/* Notifications Bell */}
        <Button
          variant="ghost"
          size="icon"
          id="notifications-btn"
          className="relative h-10 w-10 rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-primary/20 dark:border-slate-950">
              {pendingCount}
            </span>
          )}
        </Button>

        {/* User switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger
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
          <DropdownMenuContent align="end" sideOffset={8} className="w-52">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">
              Switch User (Demo)
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {employees.map((emp) => (
              <DropdownMenuItem
                key={emp.id}
                onClick={() => switchUser(emp.id)}
                className={cn(
                  "gap-2.5 cursor-pointer",
                  emp.id === currentUser.id && "bg-primary/5 text-primary"
                )}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                  {emp.avatarInitials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{emp.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">{emp.role}</span>
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-2.5 text-rose-500 hover:text-rose-600 focus:text-rose-600 cursor-pointer font-bold"
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
