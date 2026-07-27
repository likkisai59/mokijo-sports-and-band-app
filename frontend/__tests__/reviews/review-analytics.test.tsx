import { ProfileReviewAnalytics } from "@/types/review";

export function testRatingDistributionCalculations() {
  const distribution = { 5: 20, 4: 5, 3: 0, 2: 0, 1: 0 };
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  console.assert(total === 25, "Total distribution count should be 25");

  const fiveStarPercentage = Math.round((distribution[5] / total) * 100);
  console.assert(fiveStarPercentage === 80, "5-star percentage should be 80%");
}

export function testAnalyticsContractValidation() {
  const mockAnalytics: ProfileReviewAnalytics = {
    average_rating: 4.85,
    total_reviews: 40,
    rating_distribution: { 5: 35, 4: 5, 3: 0, 2: 0, 1: 0 },
    five_star_ratio: 87.5,
    public_reviews_count: 40,
    private_reviews_count: 0,
    recent_reviews: [],
    trend: [
      { period: "Jan 2026", average_rating: 4.8, count: 10 },
      { period: "Feb 2026", average_rating: 4.9, count: 12 }
    ]
  };

  console.assert(mockAnalytics.average_rating === 4.85, "Average rating mismatch");
  console.assert(mockAnalytics.five_star_ratio === 87.5, "Five star ratio mismatch");
  console.assert(mockAnalytics.trend.length === 2, "Trend points count mismatch");
}
