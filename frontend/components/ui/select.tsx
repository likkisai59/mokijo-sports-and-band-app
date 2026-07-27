"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/utils/cn";

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (val: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function Select({
  children,
  value,
  onValueChange,
  defaultValue,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (val: string) => void;
  defaultValue?: string;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const [open, setOpen] = React.useState(false);

  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = (val: string) => {
    if (onValueChange) {
      onValueChange(val);
    } else {
      setInternalValue(val);
    }
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        setOpen,
      }}
    >
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  id,
  className,
  children,
  disabled,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectTrigger must be within Select");

  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/45 disabled:cursor-not-allowed disabled:opacity-50 text-left",
        className
      )}
      onClick={() => !disabled && context.setOpen(!context.open)}
    >
      {children}
      <ChevronDown className="h-4 w-4 text-text-secondary opacity-50" />
    </button>
  );
}

export function SelectValue({
  placeholder,
}: {
  placeholder?: string;
}) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be within Select");

  return (
    <span className={cn(!context.value && "text-text-muted")}>
      {context.value || placeholder}
    </span>
  );
}

export function SelectContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectContent must be within Select");

  if (!context.open) return null;

  return (
    <>
      {/* Backdrop to close dropdown on outer click */}
      <div className="fixed inset-0 z-40" onClick={() => context.setOpen(false)} />
      <div
        className={cn(
          "absolute left-0 top-[calc(100%+4px)] z-50 min-w-[8rem] w-full overflow-hidden rounded-md border border-border bg-bg-elevated text-text-primary shadow-md animate-in fade-in-80 slide-in-from-top-1 duration-100",
          className
        )}
      >
        <div className="p-1">{children}</div>
      </div>
    </>
  );
}

export function SelectItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectItem must be within Select");

  const isSelected = context.value === value;

  return (
    <button
      type="button"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-text-primary outline-none hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors text-left",
        isSelected && "bg-primary/5 text-primary",
        className
      )}
      onClick={() => context.onValueChange(value)}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4 text-primary" />
        </span>
      )}
      {children}
    </button>
  );
}
