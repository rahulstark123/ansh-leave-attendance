"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (pathname === "/adminpanel/login") {
      setChecking(false);
      return;
    }

    fetch("/api/adminpanel/auth/me")
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true);
        } else {
          router.replace("/adminpanel/login");
        }
      })
      .catch(() => router.replace("/adminpanel/login"))
      .finally(() => setChecking(false));
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/adminpanel/auth/logout", { method: "POST" });
    router.replace("/adminpanel/login");
  };

  if (pathname === "/adminpanel/login") {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0c14]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5a3ab6]" />
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="flex min-h-screen bg-[#0a0c14] text-white">
      <AdminSidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
