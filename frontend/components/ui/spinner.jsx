import { cn } from "@/utils/cn";

export function Spinner({ className, size = "md", ...props }) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-border border-t-primary",
        size === "sm" && "h-4 w-4 border-1",
        size === "md" && "h-8 w-8",
        size === "lg" && "h-12 w-12 border-3",
        className
      )}
      {...props}
      role="status"
      aria-label="loading"
    />
  );
}
