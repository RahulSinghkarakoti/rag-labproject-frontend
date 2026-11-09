"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useThemeAccent,
  ThemePreset,
} from "./theme-accent-provider";
import { cn } from "@/lib/utils";
import { Check, Sparkles, Terminal } from "lucide-react";

function getFontFamily(font: string) {
  switch (font) {
    case "jetbrains":
      return "var(--font-jetbrains), monospace";
    case "fira":
      return "var(--font-fira), monospace";
    case "space":
      return "var(--font-space), monospace";
    case "ibm-plex":
      return "var(--font-ibm-plex), monospace";
    default:
      return "monospace";
  }
}

export function ThemeOptionsDialog({
  children,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOnOpenChange || setInternalOpen;

  const { activePresetId, applyPreset, presets } = useThemeAccent();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-2xl bg-card border-border text-foreground font-mono p-0 overflow-hidden shadow-2xl">
        {/* Compact Dense Header */}
        <div className="border-b border-border bg-secondary/40 px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="size-3.5 text-accent animate-pulse" />
            <DialogTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
              [ TERMINAL PROFILES ]
            </DialogTitle>
          </div>
          <span className="text-[9px] text-muted-foreground uppercase border border-border px-1.5 py-0.5">
            {presets.length} CURATED TUIS
          </span>
        </div>

        {/* Dense Grid: Only Theme Name & Rich Immune Preview */}
        <div className="p-3 max-h-[78vh] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {presets.map((preset) => {
              const isActive = activePresetId === preset.id;
              const cardFont = getFontFamily(preset.font);

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={cn(
                    "text-left p-2 border transition-all relative flex flex-col justify-between cyber-chamfer-sm group cursor-pointer",
                    isActive
                      ? "border-accent bg-accent/10 shadow-sm ring-1 ring-accent"
                      : "border-border bg-card hover:border-accent/60 hover:bg-secondary/30"
                  )}
                >
                  {/* Theme Name Header */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: preset.accent }}
                      />
                      <span className="text-[10px] font-black tracking-wider uppercase text-foreground truncate">
                        {preset.name}
                      </span>
                    </div>

                    {isActive && (
                      <span className="text-[8px] text-accent font-bold flex items-center gap-0.5 shrink-0">
                        <Check className="size-3" />
                      </span>
                    )}
                  </div>

                  {/* IMMUNE RICH MINI TERMINAL PREVIEW */}
                  <div
                    style={{
                      backgroundColor: preset.bg,
                      borderColor: preset.border,
                      borderWidth: "1px",
                      borderStyle: "solid",
                      fontFamily: cardFont,
                      color: preset.text,
                    }}
                    className="w-full rounded-xs p-1.5 shadow-inner text-[8px] select-none"
                  >
                    {/* Mini Window Bar */}
                    <div
                      style={{
                        backgroundColor: preset.surface,
                        borderBottomColor: preset.border,
                        borderBottomWidth: "1px",
                        borderBottomStyle: "solid",
                        color: preset.subtext,
                      }}
                      className="-mx-1.5 -mt-1.5 px-1.5 py-0.5 flex items-center justify-between mb-1.5 text-[7px]"
                    >
                      <div className="flex items-center gap-0.5">
                        <span className="size-1 rounded-full inline-block" style={{ backgroundColor: "#ff5f56" }} />
                        <span className="size-1 rounded-full inline-block" style={{ backgroundColor: "#ffbd2e" }} />
                        <span className="size-1 rounded-full inline-block" style={{ backgroundColor: "#27c93f" }} />
                        <span className="ml-1 tracking-wider uppercase truncate opacity-70">tty0</span>
                      </div>
                      <span
                        className="px-1 font-bold text-[6.5px] rounded-none"
                        style={{
                          backgroundColor: preset.accent,
                          color: preset.accentFg,
                        }}
                      >
                        RUN
                      </span>
                    </div>

                    {/* Mini Terminal Content */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span style={{ color: preset.accent }} className="font-bold">&gt;</span>
                        <span style={{ color: preset.text }} className="truncate">rag-node --stream</span>
                      </div>
                      <div
                        style={{
                          borderColor: preset.border,
                          backgroundColor: preset.surface,
                          borderWidth: "1px",
                          borderStyle: "solid",
                        }}
                        className="p-1 rounded-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between text-[6.5px]">
                          <span style={{ color: preset.subtext }}>STREAM</span>
                          <span style={{ color: preset.accent }} className="font-bold">100%</span>
                        </div>
                        <div
                          style={{ backgroundColor: preset.border }}
                          className="h-0.5 w-full rounded-none overflow-hidden"
                        >
                          <div
                            style={{ backgroundColor: preset.accent, width: "75%" }}
                            className="h-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact Footer */}
        <div className="border-t border-border bg-secondary/20 px-3 py-1.5 flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground text-[9px] truncate">
            ACTIVE // {presets.find((p) => p.id === activePresetId)?.name}
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-2.5 py-0.5 bg-accent text-accent-foreground font-bold uppercase text-[10px] hover:opacity-90 cyber-chamfer-sm transition-opacity"
          >
            [ CLOSE ]
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact Theme Trigger Button
 * Renders in workspace headers and top navbars.
 */
export function ThemeTriggerButton({ className }: { className?: string }) {
  const { activePreset } = useThemeAccent();

  return (
    <ThemeOptionsDialog>
      <button
        type="button"
        title={`Active Terminal: ${activePreset.name} (Click to switch)`}
        suppressHydrationWarning
        className={cn(
          "inline-flex items-center gap-1.5 bg-card border border-border px-2 py-0.5 font-mono text-[10px] hover:border-accent/60 transition-none cyber-chamfer-sm shadow-xs group cursor-pointer",
          className
        )}
      >
        <Terminal className="size-2.5 text-accent" />
        <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider">
          TUI:
        </span>
        <span
          className="text-foreground font-bold truncate max-w-[90px] sm:max-w-none"
          suppressHydrationWarning
        >
          {activePreset.name}
        </span>
        <span
          className="size-1.5 rounded-full inline-block shrink-0"
          style={{ backgroundColor: activePreset.accent }}
          suppressHydrationWarning
        />
        <Sparkles className="size-2.5 text-muted-foreground group-hover:text-accent transition-colors ml-0.5" />
      </button>
    </ThemeOptionsDialog>
  );
}
