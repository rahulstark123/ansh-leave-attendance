"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useUiStore } from "@/stores/ui-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // 5 minutes
          },
        },
      })
  );

  const appearance = useUiStore((s) => s.appearance);
  const accentTheme = useUiStore((s) => s.accentTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    
    // Sync light/dark mode
    if (appearance === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Sync accent theme
    root.setAttribute("data-accent", accentTheme);
  }, [appearance, accentTheme, mounted]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
