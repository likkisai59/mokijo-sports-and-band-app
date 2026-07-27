"use client";

import * as React from "react";
import { User, CheckCircle2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

export interface ReviewAuthorProps {
  name?: string;
  role?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
  isVerifiedBooking?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ReviewAuthor({
  name = "Verified Customer",
  role,
  avatarUrl,
  createdAt,
  isVerifiedBooking = true,
  size = "md",
  className
}: ReviewAuthorProps) {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : null;

  const avatarSize = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base"
  }[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold overflow-hidden border border-border/50", avatarSize)}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <User className="h-1/2 w-1/2" />
        )}
      </div>

      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h4 className="text-sm font-bold text-text-primary leading-tight">{name}</h4>
          {isVerifiedBooking && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded-full" title="Verified Completed Booking">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          {role && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 uppercase font-medium">
              {role.replace("_", " ")}
            </Badge>
          )}
          {formattedDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-text-muted/70" />
              {formattedDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
