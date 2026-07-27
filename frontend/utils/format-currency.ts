/**
 * Format raw numbers into standard INR currency strings.
 * Example: 8000 -> ₹8,000
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
