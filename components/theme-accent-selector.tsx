"use client";

import { useThemeAccent, AccentColor } from "./theme-accent-provider";
import { cn } from "@/lib/utils";

const ACCENTS: { id: AccentColor; label: string; color: string }[] = [
  { id: "green", label: "GRN", color: "#00ff88" },
  { id: "blue", label: "BLU", color: "#00d4ff" },
  { id: "orange", label: "ORG", color: "#ff6600" },
];

export function ThemeAccentSelector({ className }: { className?: string }) {
  const { accent, setAccent } = useThemeAccent();

  return (
    <div className={cn("inline-flex items-center gap-1 bg-[#12121a] border border-[#2a2a3a] p-1 cyber-chamfer-sm font-mono text-[10px]", className)}>
      <span className="text-muted-foreground uppercase px-1 font-bold tracking-wider">COLOR:</span>
      {ACCENTS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setAccent(item.id)}
          className={cn(
            "px-2 py-0.5 cyber-chamfer-sm font-bold uppercase transition-none flex items-center gap-1 border border-transparent",
            accent === item.id
              ? "bg-accent text-[#0a0a0f] border-accent"
              : "text-foreground hover:bg-[#1c1c2e]"
          )}
        >
          <span
            className="size-2 rounded-full inline-block"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </button>
      ))}
    </div>
  );
}
