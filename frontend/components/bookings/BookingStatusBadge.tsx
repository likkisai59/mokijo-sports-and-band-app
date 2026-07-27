"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

interface BookingStatusBadgeProps {
  status: string;
  className?: string;
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const getStatusStyles = (s: string) => {
    const norm = s.toLowerCase();
    switch (norm) {
      case "draft":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      case "pending":
      case "under review":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "negotiation":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "accepted":
      case "confirmed":
      case "upcoming":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "rejected":
      case "cancelled":
      case "cancelled by client":
      case "cancelled by band":
      case "cancelled by venue":
      case "expired":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "payment pending":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "in progress":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "completed":
        return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "refund pending":
      case "refunded":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      default:
        return "bg-text-muted/10 text-text-muted border-text-muted/20";
    }
  };

  const capitalize = (s: string) => {
    return s.split(/[_-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  return (
    <Badge variant="outline" className={`${getStatusStyles(status)} ${className || ""}`}>
      {capitalize(status)}
    </Badge>
  );
}
