"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { useMyReviews } from "@/hooks/use-reviews";
import { ReviewList } from "@/components/reviews/ReviewList";

export default function ClientReviewsPage() {
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
            reviewer: { name: "You" },
            target: r.target_type === "artist" ? r.artist : r.venue,
        }));
    }, [reviews]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div>
                <h1 className="cd-page-title flex items-center gap-2">
                    <Star className="h-6.5 w-6.5 text-primary" />
                    My Reviews
                </h1>
                <p className="cd-page-sub">
                    View and manage the feedback you've left for artists and venues.
                </p>
            </div>

            <div className="cd-card">
                <ReviewList
                    reviews={reviewItems}
                    loading={loading}
                    error={error}
                    onRefresh={refetch}
                    emptyTitle="No Reviews Yet"
                    emptyMessage="You haven't left any reviews for your past bookings. Go to your past bookings to leave a review!"
                />
            </div>
        </div>
    );
}
