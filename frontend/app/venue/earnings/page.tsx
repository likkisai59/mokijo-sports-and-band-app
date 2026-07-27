"use client";

import * as React from "react";
import { useEarnings } from "@/hooks/use-earnings";
import { VenueRevenueChart } from "@/components/venue/VenueRevenueChart";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Download,
  Calendar,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function VenueEarningsPage() {
  const { data: summary, loading, error, refetch: fetchEarnings } = useEarnings("venue");

  const handleDownloadStatement = () => {
    toast.success("Preparing PDF tax statement download... (Placeholder active)");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-text-secondary animate-pulse">Loading earnings dashboard...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[55vh] p-4">
        <ErrorState title="Load Error" message={error || "Could not retrieve balance data."} onRetry={fetchEarnings} />
      </div>
    );
  }

  // Calculate tax metrics dynamically based on standard 18% GST estimate
  const estimatedTax = summary.total_earnings * 0.18;
  const netEarnings = summary.total_earnings - estimatedTax;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <Wallet className="h-6.5 w-6.5 text-primary" />
            Earnings & Wallet Dashboard
          </h1>
          <p className="text-xs text-text-secondary">
            Inspect payouts, track monthly revenue graphs, review tax specifications, and audit transaction ledgers.
          </p>
        </div>
        <Button 
          onClick={handleDownloadStatement}
          className="bg-primary hover:bg-primary/95 text-white font-bold h-10 px-5 flex items-center gap-1.5 self-start sm:self-center"
        >
          <Download className="h-4 w-4" />
          <span>Download Statement</span>
        </Button>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Wallet Balance */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">Wallet Balance</span>
              <p className="text-2xl font-black text-text-primary leading-none">
                ₹{summary.wallet_balance.toLocaleString("en-IN")}
              </p>
              <p className="text-[9px] text-text-secondary">Available for withdrawal</p>
            </div>
            <span className="p-3 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Wallet className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">Total Revenue</span>
              <p className="text-2xl font-black text-text-primary leading-none">
                ₹{summary.total_earnings.toLocaleString("en-IN")}
              </p>
              <p className="text-[9px] text-text-secondary">All-time credit earnings</p>
            </div>
            <span className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        {/* Pending Payouts */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">Pending Payouts</span>
              <p className="text-2xl font-black text-text-primary leading-none">
                ₹{summary.pending_payments.toLocaleString("en-IN")}
              </p>
              <p className="text-[9px] text-text-secondary">Awaiting bank settlement</p>
            </div>
            <span className="p-3 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        {/* Monthly Earnings */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">Monthly Earnings</span>
              <p className="text-2xl font-black text-text-primary leading-none">
                ₹{summary.monthly_earnings.toLocaleString("en-IN")}
              </p>
              <p className="text-[9px] text-text-secondary">Credited this calendar month</p>
            </div>
            <span className="p-3 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Calendar className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

      </div>

      {/* Main Grid: Chart & Tax Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Column */}
        <div className="lg:col-span-2">
          <VenueRevenueChart data={summary.revenue_chart} />
        </div>

        {/* Tax Summary Card */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow flex flex-col justify-between p-5 text-text-primary">
          <div className="space-y-4">
            <div className="border-b border-border/30 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-primary" />
                GST Tax Summary
              </h3>
              <p className="text-[10px] text-text-muted">Calculations based on 18% service levy</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between text-text-secondary">
                <span>Gross Revenue Rents</span>
                <span className="font-bold text-text-primary">₹{summary.total_earnings.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex items-center justify-between text-text-secondary">
                <span>Estimated Tax (18% GST)</span>
                <span className="font-bold text-error">- ₹{estimatedTax.toLocaleString("en-IN")}</span>
              </div>

              <div className="border-t border-border/30 pt-3 flex items-center justify-between font-bold">
                <span className="text-text-secondary">Estimated Net Income</span>
                <span className="text-emerald-400">₹{netEarnings.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-[10px] text-text-secondary leading-relaxed mt-4">
            <span className="font-bold text-text-primary block mb-0.5">Disclaimer:</span>
            Estimates shown are indicative. Actual filings should audit deductions, caution refund credits, and cancellation fee margins.
          </div>
        </Card>

      </div>

      {/* Transaction History Ledger */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <List className="h-4.5 w-4.5 text-primary" />
          Transaction Audit Ledger
        </h3>

        <div className="border border-border/80 bg-bg-card/45 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-bg-elevated/20 border-b border-border/70 text-text-muted font-bold text-[10px] uppercase">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-text-primary">#{(tx.id || "").substring(0, 8).toUpperCase()}</td>
                    <td className="p-4 text-text-secondary">
                      {format(new Date(tx.created_at), "do MMM yyyy HH:mm")}
                    </td>
                    <td className="p-4 text-text-primary max-w-sm truncate">{tx.description || "N/A"}</td>
                    <td className="p-4">
                      {tx.type === "credit" ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <ArrowUpCircle className="h-4 w-4" />
                          Credit
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-error font-bold">
                          <ArrowDownCircle className="h-4 w-4" />
                          Debit
                        </span>
                      )}
                    </td>
                    <td className={`p-4 font-bold ${tx.type === "credit" ? "text-emerald-400" : "text-error"}`}>
                      {tx.type === "credit" ? "+" : "-"} ₹{Number(tx.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="p-4 text-center">
                      {tx.status === "completed" ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Completed</Badge>
                      ) : tx.status === "pending" ? (
                        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/25">Pending</Badge>
                      ) : (
                        <Badge className="bg-error/10 text-error border border-error/25">Failed</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {summary.transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-text-muted italic">
                      No transactional ledger entries parsed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}

// Inline helper list icon
function List(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
