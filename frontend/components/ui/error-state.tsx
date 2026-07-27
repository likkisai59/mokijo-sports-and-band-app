import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 border border-red-950/20 rounded-xl bg-red-950/5 my-4 max-w-lg mx-auto",
        className
      )}
      {...props}
    >
      <div className="p-3 bg-red-500/10 rounded-full text-red-500 border border-red-500/20 mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary mb-6 leading-relaxed max-w-sm">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="border-red-950/50 hover:bg-red-500/10">
          Try Again
        </Button>
      )}
    </div>
  );
}
