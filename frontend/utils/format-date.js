import { format, parseISO } from "date-fns";

/**
 * Format ISO datetime strings into human-readable displays.
 * Example: "2026-07-08T10:00:00Z" -> "July 8, 2026"
 */
export function formatDate(dateString, formatPattern = "PPP") {
  if (!dateString) return "";
  try {
    return format(parseISO(dateString), formatPattern);
  } catch {
    return dateString;
  }
}
