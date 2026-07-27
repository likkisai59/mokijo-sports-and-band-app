"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, AlertTriangle, EyeOff, CheckCircle, Archive, Trash2 } from "lucide-react";

interface ReportReasonBadgeProps {
  reason: string;
  className?: string;
}

export function ReportReasonBadge({ reason, className = "" }: ReportReasonBadgeProps) {
  let badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  let icon = <AlertTriangle className="h-3 w-3" />;

  switch (reason) {
    case "Spam":
    case "Fake Review":
    case "Scam":
      badgeStyle = "bg-blue-500/10 text-blue-400 border-blue-500/20";
      icon = <AlertTriangle className="h-3 w-3" />;
      break;
    case "Harassment":
    case "Abusive Language":
    case "Hate Speech":
    case "Violence":
      badgeStyle = "bg-red-500/10 text-red-400 border-red-500/20";
      icon = <ShieldAlert className="h-3 w-3" />;
      break;
    case "Sexual Content":
    case "Personal Information":
    case "Copyright":
      badgeStyle = "bg-purple-500/10 text-purple-400 border-purple-500/20";
      icon = <ShieldAlert className="h-3 w-3" />;
      break;
    default:
      badgeStyle = "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }

  return (
    <Badge variant="outline" className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 text-[11px] ${badgeStyle} ${className}`}>
      {icon}
      <span>{reason}</span>
    </Badge>
  );
}

interface ReviewVisibilityBadgeProps {
  status: string;
  className?: string;
}

export function ReviewVisibilityBadge({ status, className = "" }: ReviewVisibilityBadgeProps) {
  let badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  let label = "Public";
  let icon = <CheckCircle className="h-3 w-3" />;

  switch (status.toLowerCase()) {
    case "flagged":
      badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
      label = "Flagged";
      icon = <AlertTriangle className="h-3 w-3" />;
      break;
    case "hidden":
      badgeStyle = "bg-orange-500/10 text-orange-400 border-orange-500/20";
      label = "Hidden";
      icon = <EyeOff className="h-3 w-3" />;
      break;
    case "removed":
      badgeStyle = "bg-red-500/10 text-red-400 border-red-500/20";
      label = "Removed";
      icon = <Trash2 className="h-3 w-3" />;
      break;
    case "archived":
      badgeStyle = "bg-slate-500/10 text-slate-400 border-slate-500/20";
      label = "Archived";
      icon = <Archive className="h-3 w-3" />;
      break;
    default:
      badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      label = "Public";
      icon = <CheckCircle className="h-3 w-3" />;
  }

  return (
    <Badge variant="outline" className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 text-[11px] capitalize ${badgeStyle} ${className}`}>
      {icon}
      <span>{label}</span>
    </Badge>
  );
}
