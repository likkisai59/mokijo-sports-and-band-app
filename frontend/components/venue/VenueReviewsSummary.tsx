"use client";

import * as React from "react";
import { Star } from "lucide-react";

interface VenueReviewsSummaryProps {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

export function VenueReviewsSummary({
  averageRating,
  totalReviews,
  distribution
}: VenueReviewsSummaryProps) {
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const isFilled = i < Math.round(rating);
      return (
        <Star 
          key={i} 
          className={`h-4 w-4 ${
            isFilled ? "text-amber-400 fill-amber-400" : "text-border fill-transparent"
          }`} 
        />
      );
    });
  };

  const getDistributionPercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 border border-border/80 bg-bg-card/45 backdrop-blur-md rounded-2xl shadow-lg text-text-primary">
      
      {/* Average rating card */}
      <div className="flex flex-col items-center justify-center text-center space-y-2 md:border-r border-border/40 pb-6 md:pb-0">
        <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Overall Rating</span>
        <div className="flex items-baseline gap-1 pt-1">
          <span className="text-5xl font-black text-text-primary leading-none">{averageRating.toFixed(1)}</span>
          <span className="text-xs text-text-muted">/ 5.0</span>
        </div>
        <div className="flex items-center gap-1 justify-center">
          {renderStars(averageRating)}
        </div>
        <span className="text-[11px] text-text-secondary pt-1">Based on {totalReviews} client reviews</span>
      </div>

      {/* Distribution progress bars */}
      <div className="md:col-span-2 space-y-2.5">
        {[5, 4, 3, 2, 1].map(stars => {
          const count = distribution[stars] || 0;
          const percentage = getDistributionPercentage(count);

          return (
            <div key={stars} className="flex items-center gap-3 text-xs">
              <span className="w-12 text-text-secondary flex items-center gap-1 font-medium">
                {stars} <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              </span>

              <div className="flex-1 h-2.5 rounded-full bg-border/40 overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <span className="w-10 text-right text-text-muted font-bold">{percentage}%</span>
              <span className="w-8 text-right text-text-secondary">({count})</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
