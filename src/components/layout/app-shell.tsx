"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SubSidebar } from "./sub-sidebar";
import { MainSidebar } from "./main-sidebar";
import { AppHeader } from "./app-header";
import { GlobalSearchModal } from "./global-search-modal";
import { useGlobalSearchShortcut } from "@/hooks/use-global-search-shortcut";
import { useUiStore } from "@/stores/ui-store";
import { Loader2 } from "lucide-react";

import { useLeaveStore } from "@/stores/leave-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  useGlobalSearchShortcut();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileSize, setIsMobileSize] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const initialize = useLeaveStore((s) => s.initialize);

  // Authenticated route protection
  useEffect(() => {
    const checkAuth = async () => {
      const session = sessionStorage.getItem("ansh_auth_session");
      const token = sessionStorage.getItem("ansh_auth_token");
      
      if (!session || !token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          sessionStorage.removeItem("ansh_auth_session");
          sessionStorage.removeItem("ansh_auth_token");
          router.push("/login");
          return;
        }

        const data = await res.json();
        if (data.onboardingRequired) {
          router.push("/onboarding");
          return;
        }

        await initialize();
        setCheckingAuth(false);
      } catch (err) {
        console.error("Auth check failed:", err);
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [pathname, router, initialize]);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");

    const handleMobileChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileSize(e.matches);
    };

    handleMobileChange(mobileQuery);
    mobileQuery.addEventListener("change", handleMobileChange);
    return () => mobileQuery.removeEventListener("change", handleMobileChange);
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#070809]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Validating secure session...
          </span>
        </div>
      </div>
    );
  }


  if (isMobileSize) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 py-16 text-center dark:bg-slate-950 animate-in fade-in duration-300">
        <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-emerald-50 text-emerald-600 shadow-xl shadow-emerald-500/10 dark:bg-emerald-950/30 dark:text-emerald-400">
          <svg className="h-11 w-11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="absolute -right-1 -top-1 flex h-7 w-7 animate-bounce items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/25">
            ★
          </div>
        </div>

        <h2 className="max-w-xs text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Best on Desktop
        </h2>

        <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Ansh Leave & Attendance is optimised for desktop use. Please open it on a larger screen for the full experience.
        </p>
      </div>
    );
  }

  const isWorkspace = pathname === "/workspace";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <MainSidebar />
      <SubSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className={isWorkspace ? "mesh-gradient flex-1 flex flex-col overflow-hidden" : "mesh-gradient flex-1 overflow-y-auto"}>
          {isWorkspace ? (
            <div className="flex-1 w-full h-full min-h-0 flex flex-col">
              {children}
            </div>
          ) : (
            <div className="mx-auto max-w-7xl p-6 md:p-10 lg:p-12">
              {children}
            </div>
          )}
        </main>
        <GlobalSearchModal />
      </div>
    </div>
  );
}
