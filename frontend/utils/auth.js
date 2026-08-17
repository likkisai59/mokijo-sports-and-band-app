/**
 * Helper to get active authentication token from localStorage.
 * Supports Band session token and Mokijo session token.
 */
export function getAuthToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("bandAccessToken") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("mokijo_access_token") ||
    ""
  );
}
