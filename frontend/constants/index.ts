export const ROLES = {
  CLIENT: "client",
  ARTIST: "artist",
  VENUE_OWNER: "venue_owner",
  ADMIN: "admin",
} as const;

export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
} as const;

export const GENRES = [
  "Rock",
  "Pop",
  "Jazz",
  "Classical",
  "Blues",
  "Metal",
  "Bollywood",
  "Electronic",
  "Folk",
] as const;

export const EVENT_TYPES = [
  "Wedding",
  "Corporate Event",
  "Private Party",
  "Concert",
  "Festival",
  "Studio Session",
] as const;
