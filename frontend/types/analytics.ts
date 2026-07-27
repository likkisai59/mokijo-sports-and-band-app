export interface KeyValuePair {
  name: string;
  value: number;
}

export interface PeakTimePoint {
  time_slot: string;
  count: number;
}

export interface RatingPoint {
  date: string;
  rating: number;
}

export interface ArtistAnalytics {
  booking_growth: number;
  revenue_growth: number;
  profile_views: number;
  booking_conversion: number;
  popular_event_types: KeyValuePair[];
  top_cities: KeyValuePair[];
  monthly_performance: Array<{ month: string; revenue: number; bookings: number }>;
  peak_booking_times: PeakTimePoint[];
  rating_trends: RatingPoint[];
}
