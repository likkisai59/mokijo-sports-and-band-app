import * as React from "react";
import { cn } from "@/utils/cn";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl bg-bg-card/40 my-4 max-w-lg mx-auto",
        className
      )}
      {...props}
    >
      <div className="p-4 bg-bg-elevated rounded-full text-text-secondary border border-border/50 mb-4 animate-pulse">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary mb-6 leading-relaxed max-w-sm">
        {description}
      </p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
