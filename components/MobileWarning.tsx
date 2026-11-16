"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "mobile_warning_dismissed";

export default function MobileWarning() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "true") {
        setDismissed(true);
      }
    } catch {
      // Ignore sessionStorage access errors (e.g. strict privacy mode)
    }
  }, []);

  const handleContinue = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore sessionStorage access errors
    }
  };

  if (!mounted) return null;

  const isOpen = isMobile && !dismissed;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleContinue(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md border-amber-500/30">
        <DialogHeader className="pr-4 text-center items-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-1">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle className="text-base font-bold tracking-tight text-foreground justify-center">
            Mobile Screen Detected
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            This project is not optimized for mobile devices. Some layouts or functions may be constrained.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleContinue}
            size="sm"
            className="w-full bg-amber-500 text-black hover:bg-amber-400 border-amber-500 font-bold uppercase tracking-wider"
          >
            CONTINUE
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
