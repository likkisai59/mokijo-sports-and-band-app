"use client";

import * as React from "react";
import Image from "next/image";
import { ReviewDetail } from "@/types/review";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare, User } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface VenueReviewDetailsReplyProps {
  review: ReviewDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onReplySubmit: (reviewId: string, replyText: string) => Promise<void>;
}

export function VenueReviewDetailsReply({
  review,
  isOpen,
  onClose,
  onReplySubmit
}: VenueReviewDetailsReplyProps) {
  const [replyText, setReplyText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (review) {
      setReplyText(review.reply_comment || "");
    } else {
      setReplyText("");
    }
  }, [review]);

  if (!review) return null;

  const handleSubmit = async () => {
    if (!replyText.trim()) {
      toast.error("Reply text cannot be empty.");
      return;
    }

    setSubmitting(true);
    try {
      await onReplySubmit(review.id, replyText.trim());
      onClose();
    } catch {
      // errors handled by service/caller
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3.5 w-3.5 ${
          i < rating ? "text-amber-400 fill-amber-400" : "text-border fill-transparent"
        }`} 
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-bg-card border border-border/85 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[85vh] text-text-primary">
        
        <DialogHeader className="border-b border-border/40 pb-4">
          <DialogTitle className="text-lg font-bold text-text-primary tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Review Details & Reply
          </DialogTitle>
        </DialogHeader>

        {/* Content Body */}
        <div className="space-y-5 py-4">
          
          {/* Customer Review Summary Card */}
          <div className="p-4 border border-border/60 bg-bg-elevated/10 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <User className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-text-primary">{review.client.name}</p>
                  <p className="text-[9px] text-text-muted">
                    {format(new Date(review.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {renderStars(review.rating)}
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed bg-bg-card/45 p-3 border border-border/40 rounded-xl">
              &quot;{review.comment}&quot;
            </p>

            {/* Customer Review Images list if any */}
            {review.images && review.images.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Uploaded Photos</span>
                <div className="grid grid-cols-4 gap-2">
                  {review.images.map((img, idx) => (
                    <a 
                      key={idx} 
                      href={img} 
                      target="_blank" 
                      rel="noreferrer"
                      className="aspect-square border border-border rounded-lg overflow-hidden block relative hover:border-primary transition-all"
                    >
                      <div className="relative h-full w-full">
                        <Image src={img} alt="review attachment" fill className="object-cover" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reply Textarea Form */}
          <div className="space-y-2">
            <Label htmlFor="reply_area" className="text-xs font-bold text-text-primary">Your Professional Reply</Label>
            <Textarea
              id="reply_area"
              placeholder="e.g. Thank you for hosting your wedding at our Grand Hall! We were thrilled to assist in making your day memorable."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              className="min-h-[100px] text-xs leading-relaxed"
            />
            <p className="text-[9px] text-text-muted">Your reply is public and visible on your public venue presentation profile.</p>
          </div>

        </div>

        {/* Dialog Footer Actions */}
        <DialogFooter className="border-t border-border/40 pt-4 flex sm:items-center sm:justify-end gap-2.5">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary h-9.5 text-xs font-semibold w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-primary hover:bg-primary/95 text-white h-9.5 text-xs font-bold w-full sm:w-auto"
          >
            {submitting ? "Posting Reply..." : review.reply_comment ? "Update Reply" : "Post Reply"}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
