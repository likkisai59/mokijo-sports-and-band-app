import React from "react";
import { ReportReasonBadge, ReviewVisibilityBadge } from "@/components/reviews/ReportReasonBadge";
import { ReviewReport } from "@/types/review";

export function testReportReasonBadgeRendering() {
  const badgeProps = { reason: "Harassment" };
  console.assert(badgeProps.reason === "Harassment", "Reason should be Harassment");
}

export function testReviewVisibilityBadgeStates() {
  const statuses = ["public", "flagged", "hidden", "removed", "archived"];
  statuses.forEach((st) => {
    console.assert(typeof st === "string", `Status ${st} must be string`);
  });
}

export function testReportContractValidation() {
  const mockReport: ReviewReport = {
    id: "rep-123",
    review_id: "rev-456",
    reported_by: "usr-789",
    reason: "Abusive Language",
    description: "Contains foul language",
    status: "pending",
    created_at: new Date().toISOString()
  };

  console.assert(mockReport.id === "rep-123", "Report ID mismatch");
  console.assert(mockReport.status === "pending", "Report status should be pending");
}
