export interface VenueBrief {
  id: string;
  name: string;
  city_id: string;
}

export interface VenueResponseData {
  id: string;
  user_id: string;
  user: {
    id: string;
    name: string;
    email: string;
    is_active: boolean;
  };
  name: string;
  venue_type: string;
  business_name: string | null;
  contact_details: string | null;
  description: string | null;
  address: string;
  city_id: string;
  city: {
    id: string;
    name: string;
  };
  min_capacity: number;
  capacity: number;
  base_price: number;
  verification_status: string;
  verification_notes: string | null;
  pincode: string | null;
  state: string | null;
  country: string | null;
  google_map_location: string | null;
  facilities: string[];
  gallery: any[];
  pricing_details: Record<string, any>;
  availability_rules: Record<string, any>;
  documents: Record<string, any>;
  metadata_fields: Record<string, any>;
  created_at: string;
}

export interface VenueDashboardData {
  total_bookings: number;
  upcoming_events_count: number;
  active_bookings_count: number;
  pending_requests_count: number;
  monthly_revenue: number;
  total_revenue: number;
  average_rating: number;
  profile_completion: number;
  venue_views: number;

  todays_bookings: Array<{
    id: string;
    client_name: string;
    event_name: string;
    time: string;
    venue_name: string;
    amount: number;
  }>;
  upcoming_events: Array<{
    id: string;
    client_name: string;
    event_name: string;
    date: string;
    time: string;
    venue_name: string;
    location: string;
    status: string;
    amount: number;
  }>;
  pending_requests: Array<{
    id: string;
    client_name: string;
    event_name: string;
    date: string;
    venue_name: string;
    amount: number;
    status: string;
  }>;
  latest_reviews: Array<{
    id: string;
    client_name: string;
    rating: number;
    comment: string;
    date: string;
  }>;
  revenue_summary: {
    month_name: string;
    target: number;
    current: number;
    percent: number;
  };
  revenue_chart: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
  booking_stats: {
    confirmed: number;
    pending: number;
    cancelled: number;
  };
  occupancy_rate: number;
  calendar_overview: {
    todays_events_count: number;
    tomorrows_events_count: number;
    blocked_dates_count: number;
    maintenance_days_count: number;
    availability_summary: string;
  };
  recent_activity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    time: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
  }>;
  performance: {
    booking_growth: number;
    revenue_growth: number;
    top_event_types: Array<{
      name: string;
      value: number;
    }>;
    monthly_occupancy: Array<{
      month: string;
      occupancy: number;
    }>;
  };
}

export interface VenueGalleryItem {
  url: string;
  is_cover: boolean;
  album: string;
}

export interface VenueVideoItem {
  url: string;
  category: string;
}

export interface VenueMediaData {
  cover_image: string | null;
  gallery: VenueGalleryItem[];
  videos: VenueVideoItem[];
  youtube_links: string[];
  virtual_tour: string | null;
}

export interface VenueWeeklyScheduleItem {
  available: boolean;
  start: string;
  end: string;
}

export interface VenueBookingItem {
  id: string;
  client_name: string;
  event_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface VenueAvailabilityData {
  weekly_schedule: Record<string, VenueWeeklyScheduleItem>;
  blocked_dates: string[];
  maintenance_days: string[];
  public_holidays: string[];
  booking_buffer_time: number;
  bookings: VenueBookingItem[];
}

export interface VenueConflictCheckRequest {
  date: string;
  start_time: string;
  end_time: string;
}

export interface VenueConflictCheckResponse {
  conflict: boolean;
  reason: string | null;
}

export interface VenueFacilitiesData {
  facilities: string[];
  details: Record<string, any>;
}

export interface VenueDiscountData {
  name: string;
  type: string;
  value: number;
}

export interface VenuePricingData {
  base_price: number;
  hourly_price: number;
  half_day_price: number;
  full_day_price: number;
  weekend_price: number;
  holiday_price: number;
  security_deposit: number;
  cleaning_charges: number;
  cancellation_charges: number;
  discounts: VenueDiscountData[];
  tax_percentage: number;
  currency: string;
}

export interface KeyValuePair {
  name: string;
  value: number;
}

export interface VenueChartDataPoint {
  month: string;
  value: number;
}

export interface VenueAnalyticsData {
  total_bookings: number;
  upcoming_events_count: number;
  active_bookings_count: number;
  pending_requests_count: number;
  monthly_revenue: number;
  total_revenue: number;
  average_rating: number;
  venue_views: number;
  occupancy_rate: number;
  monthly_growth_rate: number;

  revenue_chart: VenueChartDataPoint[];
  booking_chart: VenueChartDataPoint[];
  occupancy_chart: VenueChartDataPoint[];

  popular_event_types: KeyValuePair[];
  top_clients: KeyValuePair[];
  top_cities: KeyValuePair[];
  peak_seasons: KeyValuePair[];
}

export interface VenueDocumentsResubmitData {
  doc_pan: string;
  doc_gst?: string;
  doc_ownership_proof: string;
  doc_government_id: string;
  doc_business_license: string;
}export interface VenueSettingsData {
  is_deactivated: boolean;
  email_alerts: boolean;
  sms_alerts: boolean;
  profile_visible: boolean;
}
