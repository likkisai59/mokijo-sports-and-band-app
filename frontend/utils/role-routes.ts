/**
 * Centralized role-to-dashboard route resolver.
 *
 * This is the single authoritative source for mapping backend canonical roles
 * to their frontend overview dashboard routes.
 *
 * Canonical backend roles (MASTER.md §9.2 + §9.3):
 *   client | artist | venue_owner | admin
 *
 * Frontend dashboard routes (MASTER.md §5.6):
 *   /client/dashboard | /artist/dashboard | /venue/dashboard | /admin/dashboard
 *
 * Note: venue_owner maps to /venue (not /venue_owner) — intentional by design.
 *
 * Usage:
 *   import { getRoleDashboard } from "@/utils/role-routes";
 *   const route = getRoleDashboard(user.role);       // e.g. "/artist/dashboard"
 *   const route = getRoleDashboard("venue_owner");   // "/venue/dashboard"
 */

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  client: "/client/dashboard",
  artist: "/artist/dashboard",
  venue_owner: "/venue/dashboard",
  admin: "/admin/dashboard",
};

/**
 * Returns the correct role overview dashboard route for the given canonical
 * backend role string. Falls back to "/client/dashboard" only if the role
 * is unrecognised — this should never happen in a correctly functioning system.
 *
 * Do NOT use this fallback as a substitute for proper role resolution.
 * If this fallback fires, it indicates a backend registration or JWT bug.
 */
export function getRoleDashboard(role: string | undefined | null): string {
  if (!role) return "/client/dashboard";
  return ROLE_DASHBOARD_MAP[role] ?? "/client/dashboard";
}
