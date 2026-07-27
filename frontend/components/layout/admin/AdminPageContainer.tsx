import * as React from "react";
import { cn } from "@/utils/cn";

interface AdminPageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function AdminPageContainer({
  title,
  description,
  children,
  actions,
  className,
  ...props
}: AdminPageContainerProps) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-200", className)} {...props}>
      {/* Page Header */}
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/30 pb-4">
          <div>
            {title && <h2 className="text-xl font-bold text-text-primary font-heading tracking-tight">{title}</h2>}
            {description && <p className="text-xs text-text-secondary mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      
      {/* Page Body */}
      <div className="relative">{children}</div>
    </div>
  );
}
