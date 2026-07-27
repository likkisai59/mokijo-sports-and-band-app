import { User } from "./auth";

export interface Category {
  id: string;
  name: string;
  type: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface ArtistProfile {
  id: string;
  user_id: string;
  user: User;
  bio?: string;
  base_rate: number;
  rating: number;
  verification_status: "pending" | "approved" | "rejected";
  verification_notes?: string;

  display_name?: string;
  mobile_number?: string;
  years_of_experience: number;
  city?: string;
  state?: string;
  profile_image?: string;
  cover_image?: string;
  band_type: string;
  total_members: number;
  currency: string;
  travel_radius: number;
  travel_charges: number;
  min_booking_hours: number;
  max_booking_hours: number;
  equipment: Record<string, boolean>;
  availability: {
    weekly_schedule: Record<string, { available: boolean; start: string; end: string }>;
    break_time: { start: string; end: string };
    holidays: string[];
    blocked_dates: string[];
  };

  documents: Array<{ title: string; url: string }>;
  gallery: GalleryItem[];
  videos: VideoItem[];
  youtube_links: string[];
  instagram_reels: string[];
  pricing_details: Record<string, any>;
  genres: Category[];
  languages: Category[];
  social_links?: Record<string, string>;
  achievements?: string[];
  created_at: string;
}

export interface UpcomingEvent {
  id: string;
  client_name: string;
  event_name: string;
  date: string;
  time: string;
  location: string;
  status: string;
  amount: number;
}

export interface BookingRequest {
  id: string;
  client_name: string;
  event_name: string;
  date: string;
  amount: number;
  status: string;
}

export interface ReviewSummary {
  id: string;
  client_name: string;
  rating: number;
  comment: string;
  date: string;
}

export interface NotificationSummary {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface ChartDataPoint {
  month: string;
  revenue: number;
  bookings: number;
}

export interface ArtistDashboardData {
  total_bookings: number;
  upcoming_events_count: number;
  pending_requests_count: number;
  monthly_revenue: number;
  total_earnings: number;
  average_rating: number;
  profile_completion: number;
  profile_views: number;
  upcoming_events: UpcomingEvent[];
  recent_booking_requests: BookingRequest[];
  recent_reviews: ReviewSummary[];
  notifications: NotificationSummary[];
  revenue_chart: ChartDataPoint[];
}

export interface AvailabilityData {
  weekly_schedule: Record<string, { available: boolean; start: string; end: string }>;
  break_time: { start: string; end: string };
  blocked_dates: string[];
  holidays: string[];
}

export interface GalleryItem {
  url: string;
  is_cover: boolean;
  album: string;
}

export interface VideoItem {
  url: string;
  type: "file" | "youtube" | "instagram";
  category: string;
  thumbnail?: string;
}

export interface MediaGalleryData {
  gallery: GalleryItem[];
  videos: VideoItem[];
  youtube_links: string[];
  instagram_reels: string[];
}

export interface PackageItem {
  name: string;
  price: number;
  description?: string;
}

export interface SpecialOfferItem {
  title: string;
  discount: number;
  description?: string;
}

export interface PricingData {
  base_rate: number;
  currency: string;
  travel_radius?: number;
  travel_charges: number;
  min_booking_hours: number;
  max_booking_hours: number;
  weekend_surcharge: number;
  holiday_surcharge: number;
  packages: PackageItem[];
  special_offers: SpecialOfferItem[];
}
