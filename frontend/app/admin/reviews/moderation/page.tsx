"use client";

import * as React from "react";
import { AdminPageContainer } from "@/components/layout/admin/AdminPageContainer";
import { ModerationQueue } from "@/components/reviews/ModerationQueue";
import { ShieldCheck } from "lucide-react";

export default function AdminReviewModerationPage() {
  return (
    <AdminPageContainer
      title="Review Moderation Queue"
      description="Inspect flagged user reports, review policy compliance, hide/restore content, and track immutable audit history."
      actions={
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary flex items-center gap-1 bg-bg-card border border-border/80 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-text-primary">RBAC Guarded: Admin Only</span>
          </span>
        </div>
      }
    >
      <ModerationQueue />
    </AdminPageContainer>
  );
}
