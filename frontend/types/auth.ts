export interface User {
  id: string;
  email: string;
  role?: string;
  roles?: { id: string; name: string; description?: string }[];
  name: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role?: string;
  roles?: { id: string; name: string; description?: string }[];
  name: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface TokenPayload {
  access_token: string;
  refresh_token: string;
  role: "client" | "artist" | "venue_owner" | "admin";
}
