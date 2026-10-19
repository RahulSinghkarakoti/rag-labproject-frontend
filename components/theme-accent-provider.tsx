"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AccentColor = "green" | "blue" | "orange";

interface ThemeAccentContextType {
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
}

const ThemeAccentContext = createContext<ThemeAccentContextType>({
  accent: "green",
  setAccent: () => {},
});

export function ThemeAccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentColor>("green");

  useEffect(() => {
    const saved = localStorage.getItem("cyber-accent") as AccentColor;
    if (saved && ["green", "blue", "orange"].includes(saved)) {
      setAccentState(saved);
      document.documentElement.setAttribute("data-accent", saved);
    } else {
      document.documentElement.setAttribute("data-accent", "green");
    }
  }, []);

  const setAccent = (color: AccentColor) => {
    setAccentState(color);
    localStorage.setItem("cyber-accent", color);
    document.documentElement.setAttribute("data-accent", color);
  };

  return (
    <ThemeAccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </ThemeAccentContext.Provider>
  );
}

export const useThemeAccent = () => useContext(ThemeAccentContext);
