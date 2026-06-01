import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AccentTheme, Appearance } from "@/config/themes";
import { queuedLocalStorage } from "@/lib/safe-storage";

interface UiState {
  mainSidebarCollapsed: boolean;
  subSidebarCollapsed: boolean;
  appearance: Appearance;
  accentTheme: AccentTheme;
  toggleMainSidebar: () => void;
  toggleSubSidebar: () => void;
  setMainSidebarCollapsed: (collapsed: boolean) => void;
  setAppearance: (appearance: Appearance) => void;
  setAccentTheme: (accent: AccentTheme) => void;
}

type PersistedUiState = Pick<
  UiState,
  "mainSidebarCollapsed" | "subSidebarCollapsed" | "appearance" | "accentTheme"
>;

const defaultPersisted: PersistedUiState = {
  mainSidebarCollapsed: false,
  subSidebarCollapsed: false,
  appearance: "light",
  accentTheme: "emerald", // Default accent for Leave/Attendance app
};

function isAppearance(value: unknown): value is Appearance {
  return value === "light" || value === "dark";
}

function isAccentTheme(value: unknown): value is AccentTheme {
  return (
    value === "indigo" ||
    value === "sapphire" ||
    value === "emerald" ||
    value === "graphite"
  );
}

function normalizePersisted(persisted: unknown): PersistedUiState {
  if (!persisted || typeof persisted !== "object") {
    return defaultPersisted;
  }

  const raw = persisted as Record<string, unknown>;
  const data =
    raw.state && typeof raw.state === "object"
      ? (raw.state as Record<string, unknown>)
      : raw;

  return {
    mainSidebarCollapsed:
      typeof data.mainSidebarCollapsed === "boolean"
        ? data.mainSidebarCollapsed
        : defaultPersisted.mainSidebarCollapsed,
    subSidebarCollapsed:
      typeof data.subSidebarCollapsed === "boolean"
        ? data.subSidebarCollapsed
        : defaultPersisted.subSidebarCollapsed,
    appearance: isAppearance(data.appearance)
      ? data.appearance
      : defaultPersisted.appearance,
    accentTheme: isAccentTheme(data.accentTheme)
      ? data.accentTheme
      : defaultPersisted.accentTheme,
  };
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      mainSidebarCollapsed: false,
      subSidebarCollapsed: false,
      appearance: "light",
      accentTheme: "emerald",
      toggleMainSidebar: () =>
        set((s) => ({ mainSidebarCollapsed: !s.mainSidebarCollapsed })),
      toggleSubSidebar: () =>
        set((s) => ({ subSidebarCollapsed: !s.subSidebarCollapsed })),
      setMainSidebarCollapsed: (collapsed) =>
        set({ mainSidebarCollapsed: collapsed }),
      setAppearance: (appearance) => set({ appearance }),
      setAccentTheme: (accentTheme) => set({ accentTheme }),
    }),

    {
      name: "ansh-leave-ui",
      version: 1,
      storage: createJSONStorage(() => queuedLocalStorage),
      partialize: (state): PersistedUiState => ({
        mainSidebarCollapsed: state.mainSidebarCollapsed,
        subSidebarCollapsed: state.subSidebarCollapsed,
        appearance: state.appearance,
        accentTheme: state.accentTheme,
      }),
      migrate: (persisted) => normalizePersisted(persisted),
    }
  )
);
