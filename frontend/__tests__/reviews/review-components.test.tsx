import React from "react";
import { getQualitativeLabel } from "@/components/reviews/ReviewRating";
import { Review } from "@/types/review";

export function testQualitativeLabels() {
  const exceptional = getQualitativeLabel(5.0);
  console.assert(exceptional.text === "Exceptional", "5.0 should be Exceptional");
  console.assert(exceptional.variant === "success", "5.0 variant should be success");

  const excellent = getQualitativeLabel(4.2);
  console.assert(excellent.text === "Excellent", "4.2 should be Excellent");
  console.assert(excellent.variant === "default", "4.2 variant should be default");

  const veryGood = getQualitativeLabel(3.5);
  console.assert(veryGood.text === "Very Good", "3.5 should be Very Good");

  const average = getQualitativeLabel(2.5);
  console.assert(average.text === "Average", "2.5 should be Average");

  const poor = getQualitativeLabel(1.5);
  console.assert(poor.text === "Poor", "1.5 should be Poor");
  console.assert(poor.variant === "destructive", "1.5 variant should be destructive");
}

export function testReviewContractValidation() {
  const mockReview: Review = {
    id: "rev-123",
    booking_id: "bkg-456",
    reviewer_id: "usr-789",
    reviewer_role: "client",
    rating: 5,
    review_title: "Superb Performance",
    review_text: "Outstanding acoustics and execution!",
    comment: "Outstanding acoustics and execution!",
    is_public: true,
    images: ["/uploads/img1.jpg"],
    videos: [],
    reviewer: { id: "usr-789", name: "John Host" },
    created_at: "2026-07-21T10:00:00Z"
  };

  console.assert(mockReview.id === "rev-123", "Review ID mismatch");
  console.assert(mockReview.rating === 5, "Rating mismatch");
  console.assert(mockReview.is_public === true, "Public visibility mismatch");
  console.assert(mockReview.images.length === 1, "Images length mismatch");
}
