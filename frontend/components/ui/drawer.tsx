"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
}: DrawerProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sliding Sheet */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-bg-elevated border-l border-border p-6 shadow-xl transition-transform duration-300 flex flex-col justify-between",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-4 border-b border-border/50">
            <div>
              {title && <h3 className="text-base font-bold text-text-primary font-heading">{title}</h3>}
              {description && <p className="text-xs text-text-secondary mt-1">{description}</p>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-text-secondary hover:text-text-primary"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
