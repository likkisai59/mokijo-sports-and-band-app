export interface ClientReviewer {
  id: string;
  name: string;
}

export interface UserBrief {
  id: string;
  name: string;
  email?: string;
}

export interface Review {
  id: string;
  booking_id?: string | null;
  reviewer_id?: string | null;
  reviewer_role?: string | null;
  reviewee_id?: string | null;
  reviewee_role?: string | null;
  artist_profile_id?: string | null;
  venue_id?: string | null;
  client_id?: string | null;
  rating: number;
  review_title?: string | null;
  review_text?: string | null;
  comment?: string | null;
  is_public: boolean;
  moderation_status?: string;
  reply_comment?: string | null;
  reply_at?: string | null;
  images: string[];
  videos: string[];
  reviewer?: UserBrief | null;
  reviewee?: UserBrief | null;
  client?: ClientReviewer | null;
  created_at: string;
  updated_at?: string | null;
}

export interface CreateReviewPayload {
  booking_id?: string;
  reviewee_id?: string;
  reviewee_role?: string;
  artist_profile_id?: string;
  venue_id?: string;
  rating: number;
  review_title?: string;
  review_text?: string;
  comment?: string;
  is_public?: boolean;
  images?: string[];
  videos?: string[];
}

export interface UpdateReviewPayload {
  rating?: number;
  review_title?: string;
  review_text?: string;
  comment?: string;
  is_public?: boolean;
  images?: string[];
  videos?: string[];
}

export interface ReviewFiltersPayload {
  booking_id?: string;
  reviewer_id?: string;
  reviewee_id?: string;
  artist_profile_id?: string;
  venue_id?: string;
  rating?: number;
  is_public?: boolean;
  moderation_status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface ReviewPaginatedResponse {
  items: Review[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ReviewDetail {
  id: string;
  rating: number;
  comment: string;
  review_title?: string | null;
  review_text?: string | null;
  moderation_status?: string;
  reply_comment: string | null;
  reply_at: string | null;
  images: string[];
  videos: string[];
  client: ClientReviewer;
  created_at: string;
}

export interface ReviewSummaryResponse {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>;
  reviews: ReviewDetail[];
}

export type RatingDistribution = Record<number, number>;

export interface ReviewEligibility {
  eligible: boolean;
  booking_id: string;
  reviewer_id: string;
  reviewee_id?: string | null;
  reviewee_role?: string | null;
  reason?: string | null;
  already_reviewed: boolean;
}

// ─── ANALYTICS TYPES (PHASE 4) ─────────────────────────────────────────────

export interface ReviewTrendPoint {
  period: string;
  average_rating: number;
  count: number;
}

export interface TopRatedEntity {
  id: string;
  name: string;
  entity_type: string;
  average_rating: number;
  total_reviews: number;
  image_url?: string | null;
}

export interface MostReviewedEntity {
  id: string;
  name: string;
  entity_type: string;
  average_rating: number;
  total_reviews: number;
  image_url?: string | null;
}

export interface ProfileReviewAnalytics {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>;
  five_star_ratio: number;
  public_reviews_count: number;
  private_reviews_count: number;
  recent_reviews: Review[];
  trend: ReviewTrendPoint[];
}

export interface DashboardReviewAnalytics {
  average_rating: number;
  total_reviews: number;
  five_star_count: number;
  five_star_ratio: number;
  growth_percentage: number;
  pending_reviews_count: number;
  recent_reviews: Review[];
  latest_ratings: Review[];
}

export interface RoleComparison {
  role: string;
  average_rating: number;
  total_reviews: number;
}

export interface AdminReviewAnalytics {
  platform_average_rating: number;
  total_reviews: number;
  reviews_today: number;
  reviews_this_week: number;
  reviews_this_month: number;
  growth_percentage: number;
  top_rated_artists: TopRatedEntity[];
  top_rated_venues: TopRatedEntity[];
  lowest_rated_accounts: TopRatedEntity[];
  most_active_reviewers: UserBrief[];
  activity_breakdown: ReviewTrendPoint[];
  role_comparison: RoleComparison[];
}

export interface MarketplaceReviewAnalytics {
  highest_rated_artists: TopRatedEntity[];
  highest_rated_venues: TopRatedEntity[];
  most_reviewed_artists: MostReviewedEntity[];
  most_reviewed_venues: MostReviewedEntity[];
  trending_artists: TopRatedEntity[];
  trending_venues: TopRatedEntity[];
}

// ─── MODERATION TYPES (PHASE 5) ─────────────────────────────────────────────

export type ReportReason =
  | "Spam"
  | "Harassment"
  | "Abusive Language"
  | "Hate Speech"
  | "Discrimination"
  | "Violence"
  | "Fake Review"
  | "Sexual Content"
  | "Personal Information"
  | "Copyright"
  | "Scam"
  | "Other";

export type ReportStatus = "pending" | "under_review" | "resolved_action_taken" | "resolved_dismissed";

export type ReviewVisibility = "public" | "flagged" | "hidden" | "removed" | "archived";

export interface ReviewReport {
  id: string;
  review_id: string;
  reported_by: string;
  reason: ReportReason | string;
  description?: string | null;
  status: ReportStatus;
  assigned_admin_id?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  review?: Review | null;
  reporter?: UserBrief | null;
  assigned_admin?: UserBrief | null;
}

export interface ReportListResponse {
  items: ReviewReport[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ReportReviewPayload {
  reason: string;
  description?: string;
}

export interface ModerationActionPayload {
  action: "approve" | "dismiss" | "hide" | "restore" | "remove" | "archive" | "assign" | string;
  moderator_notes?: string;
  target_admin_id?: string;
}

export interface ReviewModerationHistory {
  id: string;
  review_id: string;
  report_id?: string | null;
  action: string;
  old_status?: string | null;
  new_status: string;
  moderated_by: string;
  moderator_notes?: string | null;
  created_at: string;
  moderator?: UserBrief | null;
}

export interface ModerationDashboardStats {
  pending_reports_count: number;
  under_review_count: number;
  hidden_reviews_count: number;
  flagged_reviews_count: number;
  total_moderated_count: number;
}
