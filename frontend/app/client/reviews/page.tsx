"use client";

import * as React from "react";
import { useMyReviews, useDeleteReview, useUpdateReview } from "@/hooks/use-reviews";
import { ReviewHeader } from "@/components/reviews/ReviewHeader";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewSummaryCard } from "@/components/reviews/ReviewSummaryCard";
import { ReviewSearch } from "@/components/reviews/ReviewSearch";
import { ReviewSortDropdown, SortOptionValue } from "@/components/reviews/ReviewSortDropdown";
import { ReviewDetailsDialog } from "@/components/reviews/ReviewDetailsDialog";
import { EditReviewDialog } from "@/components/reviews/EditReviewDialog";
import { DeleteReviewDialog } from "@/components/reviews/DeleteReviewDialog";
import { useAuth } from "@/hooks/use-auth";
import { Review, UpdateReviewPayload } from "@/types/review";
import toast from "react-hot-toast";

export default function ClientReviewsPage() {
  const { user } = useAuth();
  const { reviews, loading, error, refetch } = useMyReviews();
  const { updateReview } = useUpdateReview();
  const { deleteReview } = useDeleteReview();

  // Filter & Search states
  const [search, setSearch] = React.useState("");
  const [ratingFilter, setRatingFilter] = React.useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState<SortOptionValue>("created_at_desc");
  const [page, setPage] = React.useState(1);
  const limit = 10;

  // Dialog states
  const [selectedReview, setSelectedReview] = React.useState<Review | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Client-side filtering & sorting
  const filteredReviews = React.useMemo(() => {
    let items = [...reviews];

    if (ratingFilter !== undefined) {
      items = items.filter((r) => r.rating === ratingFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (r) =>
          (r.review_title && r.review_title.toLowerCase().includes(q)) ||
          (r.review_text && r.review_text.toLowerCase().includes(q)) ||
          (r.comment && r.comment.toLowerCase().includes(q)) ||
          (r.reviewer?.name && r.reviewer.name.toLowerCase().includes(q))
      );
    }

    if (sortBy === "created_at_desc") {
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "created_at_asc") {
      items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === "rating_desc") {
      items.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "rating_asc") {
      items.sort((a, b) => a.rating - b.rating);
    }

    return items;
  }, [reviews, ratingFilter, search, sortBy]);

  const totalPages = Math.ceil(filteredReviews.length / limit) || 1;
  const paginatedReviews = React.useMemo(() => {
    const start = (page - 1) * limit;
    return filteredReviews.slice(start, start + limit);
  }, [filteredReviews, page, limit]);

  // Aggregate stats
  const averageRating = React.useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }, [reviews]);

  const distribution = React.useMemo(() => {
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating] = (dist[r.rating] || 0) + 1;
      }
    });
    return dist;
  }, [reviews]);

  const handleEditSubmit = async (id: string, payload: UpdateReviewPayload) => {
    const result = await updateReview(id, payload);
    if (result) {
      toast.success("Review updated successfully!");
      refetch();
      return true;
    }
    return false;
  };

  const handleDeleteConfirm = async (id: string) => {
    const success = await deleteReview(id);
    if (success) {
      toast.success("Review deleted.");
      refetch();
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ReviewHeader
        title="My Submitted Reviews"
        subtitle="Manage ratings and reviews you have submitted for performers and venue hosts."
        onRefresh={refetch}
      />

      {/* Summary Card */}
      {reviews.length > 0 && (
        <ReviewSummaryCard
          averageRating={averageRating}
          totalReviews={reviews.length}
          distribution={distribution}
          selectedRatingFilter={ratingFilter}
          onRatingFilterSelect={setRatingFilter}
        />
      )}

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-bg-card p-4 shadow-sm">
        <ReviewSearch value={search} onChange={setSearch} />
        <ReviewSortDropdown value={sortBy} onChange={setSortBy} />
      </div>

      {/* Reviews List */}
      <ReviewList
        reviews={paginatedReviews}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        totalCount={filteredReviews.length}
        onPageChange={setPage}
        onRefresh={refetch}
        onViewDetails={(rev) => {
          setSelectedReview(rev);
          setDetailsDialogOpen(true);
        }}
        onEdit={(rev) => {
          setSelectedReview(rev);
          setEditDialogOpen(true);
        }}
        onDelete={(rev) => {
          setSelectedReview(rev);
          setDeleteDialogOpen(true);
        }}
        currentUserId={user?.id}
        emptyTitle="No Reviews Found"
        emptyMessage="You haven't submitted any performance reviews yet. Completed bookings will allow you to leave reviews."
      />

      {/* Dialogs */}
      <ReviewDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        review={selectedReview}
        canEdit={true}
        canDelete={true}
        onEdit={(rev) => {
          setSelectedReview(rev);
          setEditDialogOpen(true);
        }}
        onDelete={(rev) => {
          setSelectedReview(rev);
          setDeleteDialogOpen(true);
        }}
      />

      <EditReviewDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        review={selectedReview}
        onSubmit={handleEditSubmit}
      />

      <DeleteReviewDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        reviewId={selectedReview?.id}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
