"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeMode = "dark" | "light";
export type ThemeFont = "jetbrains" | "fira" | "space" | "ibm-plex" | "system";

export interface ThemePreset {
  id: string;
  name: string;
  mode: ThemeMode;
  font: ThemeFont;
  bg: string;
  surface: string;
  border: string;
  text: string;
  subtext: string;
  accent: string;
  accentFg: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "vt100",
    name: "VT100 PHOSPHOR",
    mode: "dark",
    font: "jetbrains",
    bg: "#030804",
    surface: "#08140a",
    border: "#143a1b",
    text: "#b9f5b6",
    subtext: "#4e8055",
    accent: "#00ff66",
    accentFg: "#030804",
  },
  {
    id: "amber-crt",
    name: "VT220 AMBER",
    mode: "dark",
    font: "ibm-plex",
    bg: "#090500",
    surface: "#140c02",
    border: "#3d2204",
    text: "#ffd685",
    subtext: "#805214",
    accent: "#ff9900",
    accentFg: "#090500",
  },
  {
    id: "oled-hacker",
    name: "OLED HACKER",
    mode: "dark",
    font: "jetbrains",
    bg: "#000000",
    surface: "#0a0a0a",
    border: "#222222",
    text: "#ffffff",
    subtext: "#777777",
    accent: "#76ff03",
    accentFg: "#000000",
  },
  {
    id: "netrunner",
    name: "NETRUNNER 2077",
    mode: "dark",
    font: "fira",
    bg: "#0a0915",
    surface: "#121024",
    border: "#2e2454",
    text: "#e8e5fc",
    subtext: "#6f6799",
    accent: "#ff007f",
    accentFg: "#ffffff",
  },
  {
    id: "gruvbox",
    name: "GRUVBOX TUI",
    mode: "dark",
    font: "fira",
    bg: "#1d2021",
    surface: "#282828",
    border: "#3c3836",
    text: "#ebdbb2",
    subtext: "#928374",
    accent: "#fabd2f",
    accentFg: "#1d2021",
  },
  {
    id: "dracula",
    name: "DRACULA CLI",
    mode: "dark",
    font: "fira",
    bg: "#1e1f29",
    surface: "#282a36",
    border: "#44475a",
    text: "#f8f8f2",
    subtext: "#6272a4",
    accent: "#50fa7b",
    accentFg: "#1e1f29",
  },
  {
    id: "nord",
    name: "NORD ARCTIC",
    mode: "dark",
    font: "jetbrains",
    bg: "#242933",
    surface: "#2e3440",
    border: "#434c5e",
    text: "#eceff4",
    subtext: "#7b88a1",
    accent: "#88c0d0",
    accentFg: "#242933",
  },
  {
    id: "solarized",
    name: "SOLARIZED UNIX",
    mode: "dark",
    font: "ibm-plex",
    bg: "#002b36",
    surface: "#073642",
    border: "#0d4c5c",
    text: "#93a1a1",
    subtext: "#586e75",
    accent: "#2aa198",
    accentFg: "#002b36",
  },
  {
    id: "paper-teletype",
    name: "PAPER TELETYPE",
    mode: "light",
    font: "space",
    bg: "#f3f2ee",
    surface: "#ffffff",
    border: "#cfccc0",
    text: "#181a1f",
    subtext: "#686b77",
    accent: "#b91c1c",
    accentFg: "#ffffff",
  },
];

interface ThemeAccentContextType {
  activePreset: ThemePreset;
  activePresetId: string;
  applyPreset: (presetId: string) => void;
  presets: ThemePreset[];
}

const defaultPreset = THEME_PRESETS[0];

const ThemeAccentContext = createContext<ThemeAccentContextType>({
  activePreset: defaultPreset,
  activePresetId: defaultPreset.id,
  applyPreset: () => {},
  presets: THEME_PRESETS,
});

function applyThemeToDOM(preset: ThemePreset) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Set active preset attribute
  root.setAttribute("data-theme-preset", preset.id);
  root.setAttribute("data-theme", preset.mode);
  root.setAttribute("data-font", preset.font);

  if (preset.mode === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
  }
  root.style.colorScheme = preset.mode;

  // Direct CSS variable injection for absolute consistency
  root.style.setProperty("--background", preset.bg);
  root.style.setProperty("--foreground", preset.text);
  root.style.setProperty("--card", preset.surface);
  root.style.setProperty("--card-foreground", preset.text);
  root.style.setProperty("--popover", preset.surface);
  root.style.setProperty("--popover-foreground", preset.text);
  root.style.setProperty("--border", preset.border);
  root.style.setProperty("--secondary", preset.surface);
  root.style.setProperty("--secondary-foreground", preset.text);
  root.style.setProperty("--muted", preset.surface);
  root.style.setProperty("--muted-foreground", preset.subtext);
  root.style.setProperty("--accent", preset.accent);
  root.style.setProperty("--accent-foreground", preset.accentFg);
  root.style.setProperty("--primary", preset.accent);
  root.style.setProperty("--primary-foreground", preset.accentFg);
  root.style.setProperty("--ring", preset.accent);
  root.style.setProperty("--sidebar", preset.bg);
  root.style.setProperty("--sidebar-foreground", preset.text);
  root.style.setProperty("--sidebar-border", preset.border);
  root.style.setProperty("--sidebar-primary", preset.accent);
  root.style.setProperty("--sidebar-primary-foreground", preset.accentFg);
}

export function ThemeScript() {
  const scriptContent = `(function(){try{var p=${JSON.stringify(
    THEME_PRESETS
  )};var s=localStorage.getItem("cyber-theme-preset");var m=p[0];for(var i=0;i<p.length;i++){if(p[i].id===s){m=p[i];break;}}var r=document.documentElement;r.setAttribute("data-theme-preset",m.id);r.setAttribute("data-theme",m.mode);r.setAttribute("data-font",m.font);if(m.mode==="dark"){r.classList.add("dark");r.classList.remove("light");}else{r.classList.add("light");r.classList.remove("dark");}r.style.colorScheme=m.mode;var st=r.style;st.setProperty("--background",m.bg);st.setProperty("--foreground",m.text);st.setProperty("--card",m.surface);st.setProperty("--card-foreground",m.text);st.setProperty("--popover",m.surface);st.setProperty("--popover-foreground",m.text);st.setProperty("--border",m.border);st.setProperty("--secondary",m.surface);st.setProperty("--secondary-foreground",m.text);st.setProperty("--muted",m.surface);st.setProperty("--muted-foreground",m.subtext);st.setProperty("--accent",m.accent);st.setProperty("--accent-foreground",m.accentFg);st.setProperty("--primary",m.accent);st.setProperty("--primary-foreground",m.accentFg);st.setProperty("--ring",m.accent);st.setProperty("--sidebar",m.bg);st.setProperty("--sidebar-foreground",m.text);st.setProperty("--sidebar-border",m.border);st.setProperty("--sidebar-primary",m.accent);st.setProperty("--sidebar-primary-foreground",m.accentFg);}catch(e){}})();`;

  return (
    <script
      id="cyber-theme-script"
      dangerouslySetInnerHTML={{
        __html: scriptContent,
      }}
    />
  );
}

export function ThemeAccentProvider({ children }: { children: ReactNode }) {
  const [activePresetId, setActivePresetId] = useState<string>("vt100");

  useEffect(() => {
    try {
      const domPreset = document.documentElement.getAttribute("data-theme-preset");
      const savedPresetId = domPreset || localStorage.getItem("cyber-theme-preset");
      const matched = THEME_PRESETS.find((p) => p.id === savedPresetId) || defaultPreset;

      setActivePresetId(matched.id);
      applyThemeToDOM(matched);
    } catch {}
  }, []);

  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setActivePresetId(preset.id);
    localStorage.setItem("cyber-theme-preset", preset.id);
    applyThemeToDOM(preset);
  };

  const activePreset = THEME_PRESETS.find((p) => p.id === activePresetId) || defaultPreset;

  return (
    <ThemeAccentContext.Provider
      value={{
        activePreset,
        activePresetId,
        applyPreset,
        presets: THEME_PRESETS,
      }}
    >
      {children}
    </ThemeAccentContext.Provider>
  );
}

export const useThemeAccent = () => useContext(ThemeAccentContext);
