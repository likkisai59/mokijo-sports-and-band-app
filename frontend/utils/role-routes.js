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
 */

const ROLE_DASHBOARD_MAP = {
  client: "/client/dashboard",
  artist: "/artist/dashboard",
  venue_owner: "/venue/dashboard",
  admin: "/admin/dashboard",
};

/**
 * Returns the correct role overview dashboard route for the given canonical
 * backend role string.
 */
export function getRoleDashboard(role) {
  if (!role) return "/client/dashboard";
  return ROLE_DASHBOARD_MAP[role] ?? "/client/dashboard";
}
