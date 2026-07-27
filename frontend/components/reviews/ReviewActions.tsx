"use client";

import * as React from "react";
import { MoreVertical, Eye, Edit3, Trash2, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export interface ReviewActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReply?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canReply?: boolean;
  className?: string;
}

export function ReviewActions({
  onView,
  onEdit,
  onDelete,
  onReply,
  canEdit = false,
  canDelete = false,
  canReply = false,
  className
}: ReviewActionsProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!onView && !canEdit && !canDelete && !canReply) {
    return null;
  }

  return (
    <div className={cn("relative inline-block text-left", className)} ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="h-8 w-8 p-0 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated"
        aria-label="Review actions menu"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-border bg-bg-card p-1 shadow-xl z-20 animate-in fade-in zoom-in-95 duration-150">
          {onView && (
            <button
              onClick={() => {
                setOpen(false);
                onView();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-primary" />
              <span>View Full Details</span>
            </button>
          )}

          {canReply && onReply && (
            <button
              onClick={() => {
                setOpen(false);
                onReply();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Reply className="h-3.5 w-3.5" />
              <span>Respond to Review</span>
            </button>
          )}

          {canEdit && onEdit && (
            <button
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5 text-blue-400" />
              <span>Edit Review</span>
            </button>
          )}

          {canDelete && onDelete && (
            <button
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Review</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
