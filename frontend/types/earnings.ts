export interface Transaction {
  id: string;
  booking_id: string | null;
  amount: number;
  type: "credit" | "debit";
  status: "pending" | "completed" | "failed";
  description: string | null;
  created_at: string;
}

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
}

export interface EarningsSummary {
  wallet_balance: number;
  total_earnings: number;
  monthly_earnings: number;
  pending_payments: number;
  completed_payments: number;
  revenue_chart: MonthlyRevenuePoint[];
  transactions: Transaction[];
}
