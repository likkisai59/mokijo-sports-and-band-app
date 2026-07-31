"use client";

import * as React from "react";
import { useArtistReviews } from "@/hooks/use-artist-reviews";
import { reviewService } from "@/services/reviewService";
import { useUpdateReview, useDeleteReview } from "@/hooks/use-reviews";
import { useAuth } from "@/hooks/use-auth";
import { ReviewHeader } from "@/components/reviews/ReviewHeader";
import { ReviewSummaryCard } from "@/components/reviews/ReviewSummaryCard";
import { ReviewSearch } from "@/components/reviews/ReviewSearch";
import { ReviewSortDropdown, SortOptionValue } from "@/components/reviews/ReviewSortDropdown";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewDetailsDialog } from "@/components/reviews/ReviewDetailsDialog";
import { EditReviewDialog } from "@/components/reviews/EditReviewDialog";
import { DeleteReviewDialog } from "@/components/reviews/DeleteReviewDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Review, UpdateReviewPayload } from "@/types/review";
import toast from "react-hot-toast";

export default function ArtistReviewsPage() {
  const { user } = useAuth();
  const {
    reviews,
    averageRating,
    totalReviews,
    distribution,
    loading,
    error,
    ratingFilter,
    setRatingFilter,
    search,
    setSearch,
    page,
    setPage,
    limit,
    refetch
  } = useArtistReviews();

  const { updateReview } = useUpdateReview();
  const { deleteReview } = useDeleteReview();

  // Dialog & Reply states
  const [selectedReview, setSelectedReview] = React.useState<Review | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [submittingReply, setSubmittingReply] = React.useState(false);

  // Sorting state
  const [sortBy, setSortBy] = React.useState<SortOptionValue>("created_at_desc");

  // Adapt ReviewDetail[] to Review[] for ReviewList component
  const reviewItems: Review[] = React.useMemo(() => {
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      review_title: r.review_title,
      review_text: r.review_text || r.comment,
      comment: r.comment,
      is_public: true,
      reply_comment: r.reply_comment,
      reply_at: r.reply_at,
      images: r.images || [],
      videos: r.videos || [],
      client: r.client,
      reviewer: { id: r.client.id, name: r.client.name },
      created_at: r.created_at
    }));
  }, [reviews]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      await reviewService.replyToReview(selectedReview.id, replyText.trim());
      toast.success("Reply posted successfully!");
      setReplyText("");
      setReplyDialogOpen(false);
      refetch();
    } catch {
      toast.error("Failed to post reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleEditSubmit = async (id: string, payload: UpdateReviewPayload) => {
    const result = await updateReview(id, payload);
    if (result) {
      toast.success("Review updated.");
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

  const totalPages = Math.ceil(totalReviews / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <ReviewHeader
        title="Performer Reviews & Feedback"
        subtitle="Manage ratings, reviews, and client responses for your artist profile."
        onRefresh={refetch}
      />

      {/* Summary Card */}
      <ReviewSummaryCard
        averageRating={averageRating}
        totalReviews={totalReviews}
        distribution={distribution}
        selectedRatingFilter={ratingFilter}
        onRatingFilterSelect={(r) => {
          setRatingFilter(r);
          setPage(1);
        }}
      />

      {/* Search & Sort controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-bg-card p-4 shadow-sm">
        <ReviewSearch
          value={search}
          onChange={(q) => {
            setSearch(q);
            setPage(1);
          }}
        />
        <ReviewSortDropdown value={sortBy} onChange={setSortBy} />
      </div>

      {/* Review List */}
      <ReviewList
        reviews={reviewItems}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        totalCount={totalReviews}
        onPageChange={setPage}
        onRefresh={refetch}
        onViewDetails={(rev) => {
          setSelectedReview(rev);
          setDetailsDialogOpen(true);
        }}
        onReply={(rev) => {
          setSelectedReview(rev);
          setReplyText(rev.reply_comment || "");
          setReplyDialogOpen(true);
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
        emptyTitle="No Verified Reviews Found"
        emptyMessage="You have no verified reviews matching your filter criteria yet."
      />

      {/* Details Dialog */}
      <ReviewDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        review={selectedReview}
        canReply={true}
        onReply={(rev) => {
          setSelectedReview(rev);
          setReplyText(rev.reply_comment || "");
          setReplyDialogOpen(true);
        }}
      />

      {/* Edit Dialog */}
      <EditReviewDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        review={selectedReview}
        onSubmit={handleEditSubmit}
      />

      {/* Delete Dialog */}
      <DeleteReviewDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        reviewId={selectedReview?.id}
        onConfirm={handleDeleteConfirm}
      />

      {/* Reply Modal */}
      {selectedReview && (
        <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl bg-bg-card p-6 border border-border shadow-2xl space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-text-primary">
                Respond to Client Review
              </DialogTitle>
              <p className="text-xs text-text-secondary">
                Your response will be displayed publicly on your performer profile.
              </p>
            </DialogHeader>

            <form onSubmit={handleReplySubmit} className="space-y-4">
              <Textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="E.g. Thank you for booking us! We enjoyed performing at your event."
                className="text-xs bg-bg-card border-border/80 resize-none"
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyDialogOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingReply || !replyText.trim()}
                  className="text-xs font-bold bg-primary text-white hover:bg-primary-hover"
                >
                  {submittingReply ? "Posting..." : "Post Response"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
