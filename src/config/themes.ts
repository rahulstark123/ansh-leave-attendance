export type Appearance = "light" | "dark";
export type AccentTheme = "indigo" | "sapphire" | "emerald" | "graphite";

export interface AccentThemeMeta {
  id: AccentTheme;
  label: string;
  swatch: string;
  description: string;
}

export const accentThemes: AccentThemeMeta[] = [
  {
    id: "emerald",
    label: "Forest Emerald",
    swatch: "#10b981",
    description: "Trustworthy and growth-oriented (HR Default)",
  },
  {
    id: "indigo",
    label: "Electric Indigo",
    swatch: "#6366f1",
    description: "Premium default — vibrant and modern",
  },
  {
    id: "sapphire",
    label: "Sapphire Blue",
    swatch: "#0ea5e9",
    description: "Clear and focused for high-density data",
  },
  {
    id: "graphite",
    label: "Modern Graphite",
    swatch: "#1e293b",
    description: "Minimalist and sophisticated",
  },
];

export const appearanceOptions: { id: Appearance; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];
