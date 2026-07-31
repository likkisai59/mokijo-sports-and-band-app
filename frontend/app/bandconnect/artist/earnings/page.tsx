"use client";

import * as React from "react";
import { useArtistEarnings } from "@/hooks/use-artist-earnings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Percent, 
  FileText, 
  RefreshCw,
  Clock,
  ShieldCheck
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function ArtistEarningsPage() {
  const { data, loading, error, refetch } = useArtistEarnings();
  const [showTaxModal, setShowTaxModal] = React.useState(false);

  const handleDownloadStatement = () => {
    toast.success("Preparing your statement report. Download will start shortly!");
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "completed":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]">Failed</Badge>;
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-text-secondary animate-pulse">
          Loading performer wallet ledger...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[65vh] p-4">
        <ErrorState 
          title="Earnings Data Load Failure"
          message={error || "An unexpected error occurred while loading your financial summary."} 
          onRetry={refetch}
        />
      </div>
    );
  }

  // Find max value in chart points to calibrate SVG heights
  const maxRevenue = Math.max(...data.revenue_chart.map(p => p.revenue), 1000);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Earnings & Wallet Ledger
          </h1>
          <p className="text-xs text-text-secondary">
            Check payment histories, execute payouts, download statements, and overview annual tax sheets.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowTaxModal(true)}
            className="flex items-center gap-1 text-xs h-9"
          >
            <Percent className="h-4 w-4" />
            <span>Tax Summary</span>
          </Button>

          <Button 
            onClick={refetch}
            variant="outline" 
            size="sm" 
            className="h-9 w-9 p-0 flex items-center justify-center"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Wallet Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary/20 via-bg-card/90 to-bg-card/90 backdrop-blur-md border border-primary/30 p-5 rounded-2xl shadow-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Available Wallet Balance</span>
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black text-text-primary block">
              {formatCurrency(data.wallet_balance)}
            </span>
            <span className="text-[10px] text-text-muted block">Direct bank payout active</span>
          </div>
        </Card>

        {/* Total Earnings */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Lifetime Gross Earnings</span>
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black text-text-primary block">
              {formatCurrency(data.total_earnings)}
            </span>
            <span className="text-[10px] text-text-muted block">Includes platform commissions</span>
          </div>
        </Card>

        {/* Monthly earnings */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Earnings (Current Month)</span>
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black text-text-primary block">
              {formatCurrency(data.monthly_earnings)}
            </span>
            <span className="text-[10px] text-text-muted block">Resets on next calendar month</span>
          </div>
        </Card>

        {/* Pending payments */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Pending Deposits</span>
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black text-text-primary block">
              {formatCurrency(data.pending_payments)}
            </span>
            <span className="text-[10px] text-text-muted block">Gigs awaiting completion</span>
          </div>
        </Card>

      </div>

      {/* Split layout: Chart and History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl">
            <CardHeader className="p-0 pb-4 border-b border-border/40">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary">
                Monthly Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-6">
              {/* Animated SVG Bar Graph */}
              <div className="h-44 w-full flex items-end justify-between px-2 gap-2 relative">
                {/* Horizontal gridlines */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-border/20" />
                <div className="absolute inset-x-0 bottom-[33%] h-px bg-border/10 border-dashed" />
                <div className="absolute inset-x-0 bottom-[66%] h-px bg-border/10 border-dashed" />
                <div className="absolute inset-x-0 top-0 h-px bg-border/10 border-dashed" />

                {data.revenue_chart.map((point, idx) => {
                  const percent = (point.revenue / maxRevenue) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative z-10">
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-5 text-[8px] bg-bg-elevated border border-border px-1 py-0.5 rounded text-text-primary font-black z-20 transition-opacity">
                        {formatCurrency(point.revenue)}
                      </span>
                      <div 
                        style={{ height: `${Math.max(percent, 4)}%` }}
                        className="w-full bg-gradient-to-t from-primary to-primary-light rounded-t-md transition-all duration-1000 ease-out group-hover:brightness-110"
                      />
                      <span className="text-[10px] font-bold text-text-muted mt-2 block uppercase">{point.month}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Special Actions triggers */}
          <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase text-text-primary tracking-wider">Reports & Statements</h4>
            <div className="space-y-2">
              <Button 
                onClick={handleDownloadStatement}
                variant="outline" 
                className="w-full h-10 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span>Export Transaction Statement</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Transactions Table */}
        <div className="lg:col-span-2">
          <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="pb-3 border-b border-border/50 bg-bg-elevated/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary">
                Ledger Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-bg-elevated/20 text-text-muted font-bold uppercase tracking-wider">
                    <th className="p-4">Description</th>
                    <th className="p-4">Transaction Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {data.transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-bg-elevated/10 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-text-primary block">{tx.description || "Inbound booking payout"}</span>
                        <span className="text-[10px] text-text-muted block mt-0.5">ID: {tx.id.slice(0, 8)}...</span>
                      </td>
                      <td className="p-4 font-semibold text-text-secondary">
                        {format(new Date(tx.created_at), "dd MMM yyyy HH:mm")}
                      </td>
                      <td className="p-4 font-black text-text-primary">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="p-4 font-bold">
                        {tx.type === "credit" ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <ArrowUpRight className="h-4 w-4 shrink-0" />
                            Credit
                          </span>
                        ) : (
                          <span className="text-primary flex items-center gap-1">
                            <ArrowDownLeft className="h-4 w-4 shrink-0" />
                            Debit
                          </span>
                        )}
                      </td>
                      <td className="p-4">{getStatusBadge(tx.status)}</td>
                    </tr>
                  ))}
                  {data.transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-xs text-text-muted italic">
                        No transactions registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Tax Summary placeholder Modal overlay */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-bg-card border border-border/80 max-w-md w-full rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
              <FileText className="h-5.5 w-5.5 text-primary" />
              Annual Tax Summary (Estimate)
            </h3>
            
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              Below is an estimation of your platform earnings for the current tax assessment cycle. Tax rules vary by location.
            </p>

            <div className="mt-5 space-y-3.5 divide-y divide-border/40 text-xs">
              <div className="flex justify-between items-center py-2.5">
                <span className="text-text-secondary">Gross Platform Sales</span>
                <span className="font-bold text-text-primary">{formatCurrency(data.total_earnings)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-text-secondary">Deductible Commission (10%)</span>
                <span className="font-bold text-primary">-{formatCurrency(data.total_earnings * 0.1)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-text-secondary">Net Taxable Revenue</span>
                <span className="font-bold text-text-primary">{formatCurrency(data.total_earnings * 0.9)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-text-secondary">Estimated Tax Bracket Liability</span>
                <span className="font-bold text-text-primary">Zone Specific (Calculated at withdrawal)</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button 
                onClick={() => {
                  setShowTaxModal(false);
                  toast.success("Tax estimation summary statement generated!");
                }}
                className="flex-1 bg-primary text-white font-bold h-10 flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="h-4.5 w-4.5" />
                <span>Calculate Details</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowTaxModal(false)}
                className="h-10 text-xs"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
