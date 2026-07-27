"use client";

import * as React from "react";
import { ReviewSummary } from "@/types/artist";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";

interface ReviewsWidgetProps {
  reviews: ReviewSummary[];
}

export function ReviewsWidget({ reviews }: ReviewsWidgetProps) {
  return (
    <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl h-full">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary">
          Recent Client Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4 max-h-87.5 overflow-y-auto pr-1">
        {reviews.map((rev) => (
          <div 
            key={rev.id} 
            className="p-3.5 rounded-xl border border-border/60 bg-bg-elevated/10 space-y-2 hover:border-primary/40 transition-colors"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-text-primary block">{rev.client_name}</span>
              <div className="flex items-center gap-0.5 text-yellow-400">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-xs font-bold text-text-primary">{rev.rating}</span>
              </div>
            </div>

            <p className="text-xs text-text-secondary italic leading-relaxed">
              &ldquo;{rev.comment}&rdquo;
            </p>

            <div className="flex justify-between items-center text-[10px] text-text-muted border-t border-border/40 pt-2">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Verified Booking
              </span>
              <span>{rev.date}</span>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="text-center py-10 space-y-1">
            <p className="text-sm text-text-secondary font-medium">No reviews yet.</p>
            <p className="text-xs text-text-muted">Reviews from clients appear here after events.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
