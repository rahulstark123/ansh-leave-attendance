"use client";

import { AppShell } from "@/components/layout/app-shell";

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
