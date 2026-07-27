import { mockUsers } from "./dev-mode";
import { BookingRequestDetail, BookingsListResponse } from "@/types/booking";
import { EarningsSummary } from "@/types/earnings";
import { ReviewSummaryResponse } from "@/types/review";
import { VenueDashboardData, VenueResponseData } from "@/types/venue";

// Helper categories for mock data
const mockGenres = [
  { id: "g-1", name: "Rock", type: "genre", is_active: true, created_at: new Date().toISOString() },
  { id: "g-2", name: "Pop", type: "genre", is_active: true, created_at: new Date().toISOString() }
];

const mockLanguages = [
  { id: "l-1", name: "Tamil", type: "language", is_active: true, created_at: new Date().toISOString() },
  { id: "l-2", name: "Telugu", type: "language", is_active: true, created_at: new Date().toISOString() }
];

// 1. Artist / Band Mock Preview
export const mockArtistProfile = {
  id: mockUsers.artist.id,
  user_id: mockUsers.artist.id,
  user: mockUsers.artist,
  bio: "Rhythm Collective is a premier live performance band based in South India, specializing in energetic Rock and Pop music. We have entertained audiences at over 200 corporate shows, private gigs, and college festivals.",
  base_rate: 25000,
  rating: 4.8,
  verification_status: "approved" as const,
  verification_notes: "Profile verified by compliance team.",
  display_name: "Rhythm Collective",
  mobile_number: "9876543210",
  years_of_experience: 8,
  profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  cover_image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
  band_type: "Band",
  total_members: 5,
  currency: "INR",
  travel_radius: 200,
  travel_charges: 2000,
  min_booking_hours: 2,
  max_booking_hours: 6,
  equipment: {
    sound_system: true,
    microphones: true,
    monitors: true,
    cables: true,
    mixer: true
  },
  availability: {
    weekly_schedule: {
      Monday: { available: true, start: "09:00", end: "22:00" },
      Tuesday: { available: true, start: "09:00", end: "22:00" },
      Wednesday: { available: true, start: "09:00", end: "22:00" },
      Thursday: { available: true, start: "09:00", end: "22:00" },
      Friday: { available: true, start: "09:00", end: "23:00" },
      Saturday: { available: true, start: "10:00", end: "23:59" },
      Sunday: { available: true, start: "10:00", end: "22:00" }
    },
    break_time: { start: "14:00", end: "15:00" },
    holidays: ["2026-12-25", "2026-01-01"],
    blocked_dates: ["2026-07-28"]
  },
  documents: [
    { title: "Verification ID", url: "#" },
    { title: "Acoustic Sample Video", url: "#" }
  ],
  gallery: [
    { url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4", is_cover: true, album: "Live Concerts" },
    { url: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee", is_cover: false, album: "Rehearsals" }
  ],
  videos: [
    { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", type: "youtube" as const, category: "Teaser" }
  ],
  youtube_links: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
  instagram_reels: [],
  pricing_details: {},
  genres: mockGenres,
  languages: mockLanguages,
  social_links: {
    instagram: "https://instagram.com/rhythmcollective",
    youtube: "https://youtube.com/rhythmcollective"
  },
  achievements: ["Best Indie Band 2025 Nominee", "Over 200+ Live Gigs Completed"],
  created_at: "2026-01-01T00:00:00Z"
};

// 2. Artist Notifications
export const mockArtistNotifications = [
  { id: "an-1", title: "New booking request", message: "Client Santhosh requested Rhythm Collective for a Corporate Show on 2026-08-15.", created_at: "1 hour ago", is_read: false },
  { id: "an-2", title: "Client updated booking", message: "Venue address updated for wedding gig on 2026-07-25.", created_at: "5 hours ago", is_read: false },
  { id: "an-3", title: "Booking cancelled", message: "Client cancelled birthday gig scheduled for 2026-07-20.", created_at: "1 day ago", is_read: true },
  { id: "an-4", title: "Counter offer accepted", message: "Client accepted counter-pricing of INR 28000.", created_at: "2 days ago", is_read: true },
  { id: "an-5", title: "Payment confirmed", message: "Advance payment of INR 10000 received for show ref BC-902.", created_at: "3 days ago", is_read: true },
  { id: "an-6", title: "Upcoming event reminder", message: "You have a live performance tomorrow at Grand Convention Hall.", created_at: "4 days ago", is_read: true },
  { id: "an-7", title: "Booking completed", message: "Show ref BC-890 has been marked completed. Leave a review!", created_at: "1 week ago", is_read: true },
  { id: "an-8", title: "New review received", message: "Client Sneha gave you 5 stars: 'Energetic and outstanding performance!'", created_at: "1 week ago", is_read: true },
  { id: "an-9", title: "Earnings updated", message: "Monthly settlement of INR 85000 has been dispatched to bank.", created_at: "2 weeks ago", is_read: true }
];

export const mockArtistDashboard = {
  total_bookings: 48,
  upcoming_events_count: 3,
  pending_requests_count: 1,
  monthly_revenue: 0,
  total_earnings: 0,
  average_rating: 4.8,
  profile_completion: 95,
  profile_views: 1420,
  upcoming_events: [
    { id: "b-101", client_name: "Santhosh", event_name: "Corporate Gala", date: "2026-07-20", time: "18:00 - 22:00", location: "Bangalore", status: "confirmed", amount: 30000 },
    { id: "b-102", client_name: "Aditya", event_name: "College Fest", date: "2026-08-02", time: "19:00 - 23:00", location: "Chennai Arena", status: "confirmed", amount: 45000 }
  ],
  recent_booking_requests: [
    { id: "b-201", client_name: "Sneha", event_name: "Wedding Reception", date: "2026-08-15", amount: 35000, status: "pending" }
  ],
  recent_reviews: [
    { id: "rev-1", client_name: "Rohan", rating: 5, comment: "Amazing playlist! The band played popular regional hits alongside rock covers, keeping the energy top notch.", date: "2026-07-05" },
    { id: "rev-2", client_name: "Meera", rating: 4.6, comment: "Punctual, professional, and great stage presence. Will definitely book again.", date: "2026-06-28" }
  ],
  notifications: mockArtistNotifications,
  revenue_chart: [
    { month: "Jan", revenue: 50000, bookings: 2 },
    { month: "Feb", revenue: 75000, bookings: 3 },
    { month: "Mar", revenue: 100000, bookings: 4 },
    { month: "Apr", revenue: 90000, bookings: 3 },
    { month: "May", revenue: 110000, bookings: 4 },
    { month: "Jun", revenue: 125000, bookings: 5 }
  ]
};

// 3. Venue Mock Preview
export const mockVenueProfile = {
  id: mockUsers.venue_owner.id,
  user_id: mockUsers.venue_owner.id,
  user: {
    id: mockUsers.venue_owner.id,
    name: mockUsers.venue_owner.name,
    email: mockUsers.venue_owner.email,
    is_active: true
  },
  name: "BandConnect Grand Arena",
  venue_type: "Event Venue",
  business_name: "Grand Arena Hospitality Pvt Ltd",
  contact_details: "dev@arena.local",
  description: "Premier live performance arena with state-of-the-art facilities.",
  capacity: 500,
  min_capacity: 100,
  base_price: 75000,
  starting_price: 75000,
  address: "123 Main Palace Road, Near City Center",
  city_id: "city-1",
  city: { id: "city-1", name: "Bangalore", is_active: true, created_at: "" },
  state: "Karnataka",
  pincode: "560001",
  country: "India",
  status: "approved" as const,
  verification_status: "approved" as const,
  verification_notes: "Profile verified by compliance team.",
  facilities: ["ac", "parking", "stage", "sound_system", "changing_rooms", "power_backup"],
  gallery: [],
  youtube_links: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
  google_map_location: null,
  pricing_details: {},
  availability_rules: {
    booking_buffer_time: 2,
    lead_time_days: 7,
    max_days_advance: 180
  },
  weekly_schedule: {
    Monday: { available: true, start: "08:00", end: "23:00" },
    Tuesday: { available: true, start: "08:00", end: "23:00" },
    Wednesday: { available: true, start: "08:00", end: "23:00" },
    Thursday: { available: true, start: "08:00", end: "23:00" },
    Friday: { available: true, start: "08:00", end: "23:59" },
    Saturday: { available: true, start: "08:00", end: "23:59" },
    Sunday: { available: true, start: "09:00", end: "22:00" }
  },
  blocked_dates: ["2026-08-10"],
  maintenance_days: ["2026-07-29"],
  owner_name: "Dev Venue",
  contact_person: "Representative Person",
  metadata_fields: {
    landmark: "Opposite Royal Park",
    area: "Palace Suburb",
    contact_person: "Representative Person"
  },
  documents: {},
  created_at: "2026-01-01T00:00:00Z"
} as unknown as VenueResponseData;

// 4. Venue Notifications
export const mockVenueNotifications = [
  { id: "vn-1", title: "Venue-related booking activity", message: "New booking request received for Rock Night Concert on 2026-08-20.", created_at: "20 mins ago", is_read: false },
  { id: "vn-2", title: "Booking updated", message: "Organizer adjusted attendance estimate from 350 to 450 guests.", created_at: "3 hours ago", is_read: false },
  { id: "vn-3", title: "Booking cancelled", message: "Corporate Seminar on 2026-07-30 has been cancelled by host.", created_at: "1 day ago", is_read: true },
  { id: "vn-4", title: "Upcoming event", message: "Acoustic Unplugged live session tomorrow, check equipment setup.", created_at: "2 days ago", is_read: true },
  { id: "vn-5", title: "Profile or verification status", message: "Congratulations! Your registration documents have been verified.", created_at: "3 days ago", is_read: true },
  { id: "vn-6", title: "New venue review", message: "User Amit left a 5-star review: 'Outstanding acoustics and parking support!'", created_at: "1 week ago", is_read: true },
  { id: "vn-7", title: "Earnings updated", message: "Rent payout of INR 150000 completed for events BC-1002.", created_at: "1 week ago", is_read: true }
];

export const mockVenueDashboard = {
  total_bookings: 32,
  upcoming_events_count: 4,
  active_bookings_count: 22,
  pending_requests_count: 8,
  monthly_revenue: 0,
  total_revenue: 0,
  average_rating: 4.8,
  profile_completion: 85,
  venue_views: 3120,
  todays_bookings: [
    {
      id: "b-101",
      client_name: "Santhosh",
      event_name: "Corporate Gala Showcase",
      time: "18:00 - 22:00",
      venue_name: "BandConnect Grand Arena",
      amount: 30000
    }
  ],
  upcoming_events: [
    {
      id: "b-101",
      client_name: "Santhosh",
      event_name: "Corporate Gala Showcase",
      date: "2026-07-20",
      time: "18:00 - 22:00",
      venue_name: "BandConnect Grand Arena",
      location: "Bangalore Palace Grand Hall",
      status: "confirmed",
      amount: 30000
    }
  ],
  pending_requests: [
    {
      id: "b-201",
      client_name: "Sneha",
      event_name: "Wedding Reception",
      date: "2026-08-15",
      venue_name: "BandConnect Grand Arena",
      amount: 35000,
      status: "pending"
    }
  ],
  latest_reviews: [
    {
      id: "rev-101",
      client_name: "Sneha",
      rating: 5,
      comment: "Rhythm Collective was outstanding at our corporate event! Highly professional and great crowd interaction.",
      date: "2026-07-05"
    }
  ],
  revenue_summary: {
    month_name: "June",
    target: 400000,
    current: 320000,
    percent: 80
  },
  revenue_chart: [
    { month: "Jan", revenue: 150000, bookings: 2 },
    { month: "Feb", revenue: 220000, bookings: 3 },
    { month: "Mar", revenue: 300000, bookings: 4 },
    { month: "Apr", revenue: 240000, bookings: 3 },
    { month: "May", revenue: 280000, bookings: 4 },
    { month: "Jun", revenue: 320000, bookings: 5 }
  ],
  booking_stats: { confirmed: 22, pending: 8, cancelled: 2 },
  occupancy_rate: 72,
  calendar_overview: {
    todays_events_count: 1,
    tomorrows_events_count: 0,
    blocked_dates_count: 2,
    maintenance_days_count: 1,
    availability_summary: "Fully Open for Booking"
  },
  recent_activity: [
    { id: "act-101", type: "booking", title: "Booking Confirmed", description: "Rhythm Collective Band Show on 2026-07-20", time: "2 hours ago" },
    { id: "act-102", type: "review", title: "5 Star Review Received", description: "Sneha: 'The acoustics are incredible'", time: "Yesterday" },
    { id: "act-103", type: "payment", title: "Payment Dispatched", description: "INR 75000 rent payment settled", time: "3 days ago" }
  ],
  notifications: mockVenueNotifications.map(n => ({
    id: n.id,
    title: n.title,
    message: n.message,
    created_at: new Date().toISOString(),
    is_read: n.is_read
  })),
  performance: {
    booking_growth: 15,
    revenue_growth: 18,
    top_event_types: [
      { name: "Concerts", value: 45 },
      { name: "Weddings", value: 35 },
      { name: "Corporate Gigs", value: 20 }
    ],
    monthly_occupancy: [
      { month: "Jan", occupancy: 60 },
      { month: "Feb", occupancy: 65 },
      { month: "Mar", occupancy: 75 },
      { month: "Apr", occupancy: 70 },
      { month: "May", occupancy: 68 },
      { month: "Jun", occupancy: 72 }
    ]
  }
} as unknown as VenueDashboardData;

// 5. Client Mock Preview & Bookings
export const mockClientNotifications = [
  { id: "cn-1", title: "Booking request sent", message: "Your booking request for Rhythm Collective on 2026-08-15 has been sent.", created_at: "10 mins ago", is_read: false },
  { id: "cn-2", title: "Artist accepted booking", message: "Rhythm Collective accepted your request. Please complete the advance deposit.", created_at: "1 hour ago", is_read: false },
  { id: "cn-3", title: "Artist rejected booking", message: "Blue Waves Band declined request due to calendar conflict on 2026-07-22.", created_at: "1 day ago", is_read: true },
  { id: "cn-4", title: "Counter offer received", message: "Rhythm Collective sent counter offer pricing: INR 27000.", created_at: "2 days ago", is_read: true },
  { id: "cn-5", title: "Booking confirmed", message: "Your booking for BC-902 at Grand Arena is now fully confirmed.", created_at: "3 days ago", is_read: true },
  { id: "cn-6", title: "Payment required", message: "Balance amount due for gig ref BC-881. Pay now to avoid automatic release.", created_at: "4 days ago", is_read: true },
  { id: "cn-7", title: "Payment successful", message: "Payment of INR 15000 successfully processed for invoice #1002.", created_at: "4 days ago", is_read: true },
  { id: "cn-8", title: "Upcoming event reminder", message: "Your booked event 'Anniversary Gala' starts tomorrow at 18:00.", created_at: "5 days ago", is_read: true },
  { id: "cn-9", title: "Booking completed", message: "Event ref BC-720 successfully concluded. Rate the performers!", created_at: "1 week ago", is_read: true },
  { id: "cn-10", title: "Review artist", message: "Please share feedback on your booking with Rhythm Collective.", created_at: "1 week ago", is_read: true }
];

export const mockClientDashboard = {
  total_bookings: 8,
  active_gigs: 2,
  total_spent: 185000,
  upcoming_event: { id: "b-client-1", artist_name: "Rhythm Collective", venue_name: "Grand Arena", date: "2026-07-20", time: "18:00 - 22:00", amount: 30000, status: "confirmed" },
  recent_bookings: [
    { id: "b-client-1", artist_name: "Rhythm Collective", event_name: "Wedding Sangeet", date: "2026-07-20", amount: 30000, status: "confirmed" },
    { id: "b-client-2", artist_name: "DJ Rohit", event_name: "Cocktail Party", date: "2026-08-10", amount: 15000, status: "pending" }
  ],
  notifications: mockClientNotifications,
  favorite_artists: [
    { id: "fav-1", name: "Rhythm Collective", rating: 4.8, genre: "Rock/Pop", base_rate: 25000 },
    { id: "fav-2", name: "DJ Rohit", rating: 4.5, genre: "EDM", base_rate: 15000 }
  ]
};

// 6. Generic Bookings list for pagination
export const mockBookingsList = {
  total: 2,
  pages: 1,
  limit: 10,
  page: 1,
  bookings: [
    {
      id: "b-101",
      event_name: "Corporate Gala Showcase",
      event_date: "2026-07-20",
      start_time: "18:00:00",
      end_time: "22:00:00",
      location: "Bangalore Palace Grand Hall",
      proposed_price: 30000,
      counter_price: null,
      status: "confirmed" as const,
      notes: "Please arrive 1 hour early for soundcheck.",
      client: { id: "cl-1", name: "Santhosh", email: "client@dev.local" },
      artist: { id: "ar-1", display_name: "Rhythm Collective" },
      venue: { id: "vn-1", name: "Grand Arena" },
      timeline: [],
      booking_notes: [],
      timeline_events: [],
      created_at: "2026-07-01T10:00:00Z",
      updated_at: "2026-07-01T10:00:00Z"
    },
    {
      id: "b-201",
      event_name: "Wedding Reception Festivities",
      event_date: "2026-08-15",
      start_time: "19:00:00",
      end_time: "23:00:00",
      location: "Grand Palace Lawn A",
      proposed_price: 35000,
      counter_price: null,
      status: "pending" as const,
      notes: "Requires acoustic setups for background sangeet.",
      client: { id: "cl-2", name: "Sneha", email: "sneha@dev.local" },
      artist: { id: "ar-1", display_name: "Rhythm Collective" },
      venue: { id: "vn-1", name: "Grand Arena" },
      timeline: [],
      booking_notes: [],
      timeline_events: [],
      created_at: "2026-07-10T12:00:00Z",
      updated_at: "2026-07-10T12:00:00Z"
    }
  ]
} as unknown as BookingsListResponse;

// 7. Booking detail structure
export const mockBookingDetail = {
  id: "b-101",
  event_name: "Corporate Gala Showcase",
  event_date: "2026-07-20",
  start_time: "18:00:00",
  end_time: "22:00:00",
  location: "Bangalore Palace Grand Hall",
  proposed_price: 30000,
  counter_price: null,
  status: "confirmed" as const,
  notes: "Please arrive 1 hour early for soundcheck.",
  client: { id: "cl-1", name: "Santhosh", email: "client@dev.local" },
  artist: {
    id: "ar-1",
    display_name: "Rhythm Collective",
    base_rate: 25000,
    rating: 4.8,
    user: { name: "Rhythm Collective", email: "artist@dev.local" }
  },
  venue: {
    id: "vn-1",
    name: "BandConnect Grand Arena",
    address: "123 Main Palace Road, Near City Center",
    capacity: 500
  },
  booking_notes: [],
  timeline_events: [],
  created_at: "2026-07-01T10:00:00Z",
  updated_at: "2026-07-01T10:00:00Z",
  timeline: [
    { status: "pending", timestamp: "2026-07-01T10:00:00Z", by: "client", message: "Request Created" },
    { status: "confirmed", timestamp: "2026-07-03T14:30:00Z", by: "artist", message: "Booking Confirmed" }
  ],
  notes_list: [
    { id: "n-1", author_name: "Santhosh", author_role: "client", content: "Looking forward to rock covers!", created_at: "2026-07-01T10:05:00Z" }
  ]
} as unknown as BookingRequestDetail;

// 8. Earnings Mock Preview
export const mockEarningsSummary = {
  wallet_balance: 0,
  total_earnings: 0,
  monthly_earnings: 0,
  pending_payments: 0,
  completed_payments: 0,
  revenue_chart: [
    { month: "Jan", revenue: 50000 },
    { month: "Feb", revenue: 75000 },
    { month: "Mar", revenue: 100000 },
    { month: "Apr", revenue: 90000 },
    { month: "May", revenue: 110000 },
    { month: "Jun", revenue: 125000 }
  ],
  transactions: [
    {
      id: "tx-1",
      booking_id: "b-101",
      amount: 30000,
      type: "credit" as const,
      status: "completed" as const,
      description: "Payout for Corporate Gala Showcase",
      created_at: "2026-07-20T22:00:00Z"
    },
    {
      id: "tx-2",
      booking_id: "b-201",
      amount: 10000,
      type: "credit" as const,
      status: "pending" as const,
      description: "Advance deposit for Wedding Reception",
      created_at: "2026-07-10T12:00:00Z"
    }
  ]
} as unknown as EarningsSummary;

// 9. Reviews Mock List
export const mockReviewsResponse = {
  average_rating: 4.8,
  total_reviews: 2,
  rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2 },
  reviews: [
    {
      id: "rev-101",
      client_name: "Sneha",
      rating: 5,
      comment: "Rhythm Collective was outstanding at our corporate event! Highly professional and great crowd interaction.",
      created_at: "2026-07-05T20:00:00Z",
      reply_comment: "Thank you Sneha! It was a pleasure performing for your team.",
      reply_at: "2026-07-06T09:00:00Z",
      images: [],
      videos: [],
      client: { id: "cl-1", name: "Sneha" },
      booking: { event_name: "Corporate Gala Showcase", event_date: "2026-07-20" }
    },
    {
      id: "rev-102",
      client_name: "Amit",
      rating: 4.5,
      comment: "Great sound quality and stage setup. Kept the schedule perfect.",
      created_at: "2026-06-25T22:30:00Z",
      reply_comment: null,
      reply_at: null,
      images: [],
      videos: [],
      client: { id: "cl-2", name: "Amit" },
      booking: { event_name: "Acoustic Unplugged Session", event_date: "2026-06-24" }
    }
  ]
} as unknown as ReviewSummaryResponse;

export const mockArtistAnalytics = {
  booking_growth: 12,
  revenue_growth: 15,
  profile_views: 1420,
  booking_conversion: 8.5,
  popular_event_types: [
    { name: "Wedding", value: 55 },
    { name: "Corporate Show", value: 30 },
    { name: "Birthday Party", value: 15 }
  ],
  top_cities: [
    { name: "Bangalore", value: 70 },
    { name: "Chennai", value: 30 }
  ],
  monthly_performance: [
    { month: "Jan", revenue: 50000, bookings: 2 },
    { month: "Feb", revenue: 75000, bookings: 3 },
    { month: "Mar", revenue: 100000, bookings: 4 },
    { month: "Apr", revenue: 90000, bookings: 3 },
    { month: "May", revenue: 110000, bookings: 4 },
    { month: "Jun", revenue: 125000, bookings: 5 }
  ],
  peak_booking_times: [
    { time_slot: "18:00 - 20:00", count: 18 },
    { time_slot: "20:00 - 22:00", count: 24 }
  ],
  rating_trends: [
    { date: "2026-05", rating: 4.7 },
    { date: "2026-06", rating: 4.8 }
  ]
};

export const mockVenueAnalytics = {
  total_bookings: 32,
  upcoming_events_count: 4,
  active_bookings_count: 22,
  pending_requests_count: 8,
  monthly_revenue: 320000,
  total_revenue: 1800000,
  average_rating: 4.8,
  venue_views: 3120,
  occupancy_rate: 72,
  monthly_growth_rate: 15,
  revenue_chart: [
    { month: "Jan", value: 150000 },
    { month: "Feb", value: 220000 },
    { month: "Mar", value: 300000 },
    { month: "Apr", value: 240000 },
    { month: "May", value: 280000 },
    { month: "Jun", value: 320000 }
  ],
  booking_chart: [
    { month: "Jan", value: 12 },
    { month: "Feb", value: 15 },
    { month: "Mar", value: 18 },
    { month: "Apr", value: 14 },
    { month: "May", value: 20 },
    { month: "Jun", value: 22 }
  ],
  occupancy_chart: [
    { month: "Jan", value: 55 },
    { month: "Feb", value: 60 },
    { month: "Mar", value: 72 },
    { month: "Apr", value: 65 },
    { month: "May", value: 70 },
    { month: "Jun", value: 72 }
  ],
  popular_event_types: [
    { name: "Concerts", value: 45 },
    { name: "Weddings", value: 35 },
    { name: "Corporate Gigs", value: 20 }
  ],
  top_clients: [
    { name: "Santhosh", value: 4 },
    { name: "Aditya", value: 3 }
  ],
  top_cities: [
    { name: "Bangalore", value: 80 },
    { name: "Mysore", value: 20 }
  ],
  peak_seasons: [
    { name: "Winter Season", value: 65 },
    { name: "Summer Fest", value: 35 }
  ]
};

