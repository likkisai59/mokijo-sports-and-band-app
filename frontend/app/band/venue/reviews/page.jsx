"use client";
import * as React from "react";
import { Star } from "lucide-react";
import { useMyReviews } from "@/hooks/use-reviews";
import { ReviewList } from "@/components/reviews/ReviewList";

export default function VenueReviewsPage() {
    const { reviews, loading, error, refetch } = useMyReviews();

    const reviewItems = React.useMemo(() => {
        return reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            review_title: r.review_title,
            review_text: r.review_text || r.comment,
            comment: r.comment,
            is_public: r.is_public,
            reply_comment: r.reply_comment,
            reply_at: r.reply_at,
            created_at: r.created_at,
            reviewer: { name: "Client" },
            target: r.venue,
        }));
    }, [reviews]);

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-extrabold text-text-primary flex items-center gap-2">
                    <Star className="h-6 w-6 text-primary" />
                    Venue Reviews
                </h1>
                <p className="text-sm text-text-secondary">
                    View feedback left for your venue.
                </p>
            </div>
            <ReviewList
                reviews={reviewItems}
                loading={loading}
                error={error}
                onRefresh={refetch}
                emptyTitle="No Reviews Yet"
                emptyMessage="You don't have any reviews yet."
            />
        </div>
    );
}
