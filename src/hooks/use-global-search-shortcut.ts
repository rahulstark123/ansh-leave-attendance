"use client";

import { useEffect } from "react";
import { useGlobalSearchStore } from "@/stores/global-search-store";

export function useGlobalSearchShortcut() {
  const setOpen = useGlobalSearchStore((s) => s.setOpen);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      const withModifier = e.metaKey || e.ctrlKey;
      if (!isK || !withModifier) return;

      e.preventDefault();
      setOpen(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);
}
