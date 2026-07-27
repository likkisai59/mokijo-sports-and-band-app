import toast from "react-hot-toast";

export function isDevMode(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    (process.env.NEXT_PUBLIC_DEV_MODE || "false") === "true"
  );
}

export const mockUsers = {
  admin: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Dev Admin",
    email: "admin@dev.local",
    role: "admin",
    roles: [{ id: "r-admin", name: "admin" }],
    permissions: ["users.manage", "artists.verify", "venues.verify"],
  },
  artist: {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Dev Artist",
    email: "artist@dev.local",
    role: "artist",
    roles: [{ id: "r-artist", name: "artist" }],
    permissions: ["bookings.manage", "profile.edit"],
  },
  venue_owner: {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Dev Venue",
    email: "venue@dev.local",
    role: "venue_owner",
    roles: [{ id: "r-venue", name: "venue_owner" }],
    permissions: ["venue.manage", "bookings.manage"],
  },
  client: {
    id: "00000000-0000-0000-0000-000000000004",
    name: "Dev Client",
    email: "client@dev.local",
    role: "client",
    roles: [{ id: "r-client", name: "client" }],
    permissions: ["bookings.request"],
  },
};

export function makeDevToken(role: string, id: string) {
  // Simple dev token format: dev-<role>-<id>
  return `dev-${role}-${id}`;
}

export function isPreviewActive(): boolean {
  if (typeof window === "undefined") return false;
  return isDevMode() && localStorage.getItem("dev_preview_enabled") === "true";
}

export function getPreviewRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dev_preview_role");
}

export function toastMutationBlocked(): Promise<never> {
  toast.error("Real authentication is required for this action.");
  return Promise.reject(new Error("Preview mode mutation blocked."));
}

