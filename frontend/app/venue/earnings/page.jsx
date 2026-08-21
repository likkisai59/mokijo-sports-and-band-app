"use client";

import * as React from "react";
import { useEarnings } from "@/hooks/use-earnings";
import { bandEarningsService } from "@/services/bandEarningsService";
import { VenueRevenueChart } from "@/components/venue/VenueRevenueChart";
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Download,
  Calendar,
  FileText,
  CreditCard,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function VenueEarningsPage() {
  const { data: summary, loading, error, refetch: fetchEarnings } = useEarnings("venue");

  const [withdrawModalOpen, setWithdrawModalOpen] = React.useState(false);
  const [withdrawAmount, setWithdrawAmount] = React.useState("");
  const [withdrawDescription, setWithdrawDescription] = React.useState("");
  const [withdrawing, setWithdrawing] = React.useState(false);

  const handleDownloadStatement = () => {
    toast.success("Preparing PDF tax statement download for current fiscal year...");
  };

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid withdrawal amount.");
      return;
    }
    if (summary && amountNum > (summary.wallet_balance || 0)) {
      toast.error(`Amount exceeds available balance (₹${summary.wallet_balance.toLocaleString("en-IN")})`);
      return;
    }

    setWithdrawing(true);
    try {
      await bandEarningsService.requestWithdrawal(amountNum, withdrawDescription);
      toast.success("Withdrawal request dispatched for bank settlement!");
      setWithdrawModalOpen(false);
      setWithdrawAmount("");
      setWithdrawDescription("");
      fetchEarnings();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to process withdrawal request.");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "80px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          margin: "40px auto",
          maxWidth: "700px",
        }}
      >
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid #0a0a0f", borderTopColor: "#c6ff3d", animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0a0a0f" }}>Loading Venue Earnings Dashboard...</span>
        <span style={{ fontSize: "12px", color: "#64748b" }}>Retrieving live wallet balances, tax models, and ledger records</span>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "60px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          textAlign: "center",
          margin: "40px auto",
          maxWidth: "520px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ width: "52px", height: "52px", borderRadius: "18px", backgroundColor: "#fff1f2", color: "#e11d48", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AlertCircle style={{ width: "26px", height: "26px" }} />
        </div>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
            Unable to Load Earnings
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0", lineHeight: 1.5 }}>
            {error || "Could not retrieve balance data from the payments service."}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchEarnings}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            height: "40px",
            padding: "0 20px",
            borderRadius: "12px",
            backgroundColor: "#0a0a0f",
            color: "#c6ff3d",
            fontWeight: 800,
            fontSize: "13px",
            border: "none",
            cursor: "pointer",
          }}
        >
          <RefreshCw style={{ width: "15px", height: "15px" }} />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const totalEarnings = summary.total_earnings || 0;
  const walletBalance = summary.wallet_balance || 0;
  const pendingPayments = summary.pending_payments || 0;
  const monthlyEarnings = summary.monthly_earnings || 0;
  const transactions = summary.transactions || [];

  const estimatedTax = totalEarnings * 0.18;
  const netEarnings = totalEarnings - estimatedTax;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "1280px", margin: "0 auto", padding: "12px 0 40px 0", width: "100%" }}>
      
      {/* ── Top Header Banner Card ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "16px",
              backgroundColor: "#0a0a0f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c6ff3d",
              boxShadow: "0 4px 14px rgba(10, 10, 15, 0.15)",
            }}
          >
            <Wallet style={{ width: "24px", height: "24px" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#0a0a0f", margin: 0, letterSpacing: "-0.02em" }}>
                Earnings &amp; Payouts Dashboard
              </h1>
              <span
                style={{
                  backgroundColor: "#c6ff3d",
                  color: "#0a0a0f",
                  fontSize: "10px",
                  fontWeight: 900,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Instant Payouts
              </span>
            </div>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: "3px 0 0 0", fontWeight: 500 }}>
              Inspect real-time balances, review 18% GST deductions, and initiate bank account payouts.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => setWithdrawModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              height: "42px",
              padding: "0 20px",
              borderRadius: "12px",
              backgroundColor: "#c6ff3d",
              color: "#0a0a0f",
              fontWeight: 900,
              fontSize: "13px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(198, 255, 61, 0.4)",
              transition: "all 0.15s ease",
            }}
          >
            <CreditCard style={{ width: "16px", height: "16px" }} />
            <span>Withdraw Payout</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadStatement}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              height: "42px",
              padding: "0 18px",
              borderRadius: "12px",
              backgroundColor: "#0a0a0f",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "13px",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Download style={{ width: "15px", height: "15px" }} />
            <span>Tax Statement</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stats Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        
        {/* Wallet Balance */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            padding: "20px 24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Available Wallet</span>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#0a0a0f", marginTop: "4px" }}>
              ₹{walletBalance.toLocaleString("en-IN")}
            </div>
            <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700, marginTop: "2px", display: "block" }}>
              ✓ Ready for withdrawal
            </span>
          </div>
          <div style={{ width: "44px", height: "44px", borderRadius: "14px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
            <Wallet style={{ width: "20px", height: "20px" }} />
          </div>
        </div>

        {/* Total Revenue */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            padding: "20px 24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>All-Time Gross</span>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#0a0a0f", marginTop: "4px" }}>
              ₹{totalEarnings.toLocaleString("en-IN")}
            </div>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, marginTop: "2px", display: "block" }}>
              Lifetime venue receipts
            </span>
          </div>
          <div style={{ width: "44px", height: "44px", borderRadius: "14px", backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", border: "1px solid #bbf7d0" }}>
            <TrendingUp style={{ width: "20px", height: "20px" }} />
          </div>
        </div>

        {/* Pending Payouts */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            padding: "20px 24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Pending Settlement</span>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#0a0a0f", marginTop: "4px" }}>
              ₹{pendingPayments.toLocaleString("en-IN")}
            </div>
            <span style={{ fontSize: "11px", color: "#d97706", fontWeight: 700, marginTop: "2px", display: "block" }}>
              ⏳ Processing clearing cycle
            </span>
          </div>
          <div style={{ width: "44px", height: "44px", borderRadius: "14px", backgroundColor: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", border: "1px solid #fde68a" }}>
            <Clock style={{ width: "20px", height: "20px" }} />
          </div>
        </div>

        {/* Monthly Earnings */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            padding: "20px 24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>This Month</span>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#0a0a0f", marginTop: "4px" }}>
              ₹{monthlyEarnings.toLocaleString("en-IN")}
            </div>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, marginTop: "2px", display: "block" }}>
              Current billing period
            </span>
          </div>
          <div style={{ width: "44px", height: "44px", borderRadius: "14px", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a0a0f", border: "1px solid #e2e8f0" }}>
            <Calendar style={{ width: "20px", height: "20px" }} />
          </div>
        </div>

      </div>

      {/* ── 2-Column Split: Revenue Chart vs Tax Calculator ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr)) 340px", gap: "24px" }}>
        
        {/* Left: Revenue Trend Chart */}
        <div>
          <VenueRevenueChart data={summary.revenue_chart} />
        </div>

        {/* Right: Tax & GST Calculation Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            padding: "24px 28px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 900, color: "#0a0a0f", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText style={{ width: "16px", height: "16px", color: "#0a0a0f" }} />
                <span>GST Tax Breakdown</span>
              </h3>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
                18% standard event hospitality rate
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontWeight: 600 }}>
                <span>Gross Rents</span>
                <span style={{ color: "#0a0a0f", fontWeight: 800 }}>₹{totalEarnings.toLocaleString("en-IN")}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", color: "#e11d48", fontWeight: 700 }}>
                <span>Estimated Tax (18% GST)</span>
                <span>- ₹{estimatedTax.toLocaleString("en-IN")}</span>
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 900 }}>
                <span style={{ color: "#0a0a0f" }}>Net Provider Income</span>
                <span style={{ color: "#16a34a" }}>₹{netEarnings.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: "12px 14px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px", color: "#64748b", lineHeight: 1.5 }}>
            <strong style={{ color: "#0a0a0f", display: "block", marginBottom: "2px" }}>Tax Disclaimer:</strong>
            Tax rates shown are estimated. Net payouts exclude platform gateway fees and client cancellation settlements.
          </div>
        </div>

      </div>

      {/* ── Transaction Audit Ledger Table ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "24px 28px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Transaction Audit Ledger
            </h3>
            <p style={{ fontSize: "11.5px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
              Complete record of gig payouts, deposits, credits, and withdrawals
            </p>
          </div>
          <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#64748b" }}>
            {transactions.length} Total Records
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "10.5px", fontWeight: 900, textTransform: "uppercase" }}>
                <th style={{ padding: "12px 16px" }}>Ref ID</th>
                <th style={{ padding: "12px 16px" }}>Date &amp; Time</th>
                <th style={{ padding: "12px 16px" }}>Description</th>
                <th style={{ padding: "12px 16px" }}>Flow</th>
                <th style={{ padding: "12px 16px" }}>Amount</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0a0a0f", fontFamily: "monospace" }}>
                    #{String(tx.id || "").substring(0, 8).toUpperCase()}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#64748b", fontWeight: 600 }}>
                    {format(new Date(tx.created_at), "do MMM yyyy, HH:mm")}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#0a0a0f", fontWeight: 700, maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tx.description || "Booking Rental Settlement"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {tx.type === "credit" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#16a34a", fontWeight: 800, fontSize: "11.5px" }}>
                        <ArrowUpCircle style={{ width: "14px", height: "14px" }} /> Credit
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#e11d48", fontWeight: 800, fontSize: "11.5px" }}>
                        <ArrowDownCircle style={{ width: "14px", height: "14px" }} /> Debit
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 900, color: tx.type === "credit" ? "#16a34a" : "#e11d48" }}>
                    {tx.type === "credit" ? "+" : "-"} ₹{Number(tx.amount || 0).toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    {tx.status === "completed" ? (
                      <span style={{ padding: "4px 10px", borderRadius: "6px", backgroundColor: "#dcfce7", color: "#15803d", fontSize: "10.5px", fontWeight: 900, textTransform: "uppercase" }}>
                        Settled
                      </span>
                    ) : tx.status === "pending" ? (
                      <span style={{ padding: "4px 10px", borderRadius: "6px", backgroundColor: "#fef3c7", color: "#d97706", fontSize: "10.5px", fontWeight: 900, textTransform: "uppercase" }}>
                        Pending
                      </span>
                    ) : (
                      <span style={{ padding: "4px 10px", borderRadius: "6px", backgroundColor: "#fee2e2", color: "#b91c1c", fontSize: "10.5px", fontWeight: 900, textTransform: "uppercase" }}>
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>
                    No transactional ledger history entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Withdrawal Modal ── */}
      {withdrawModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10, 10, 15, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              border: "1px solid #e2e8f0",
              width: "100%",
              maxWidth: "460px",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
                  <CreditCard style={{ width: "18px", height: "18px" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                    Request Bank Payout
                  </h3>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>Transfer funds to registered bank/UPI</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWithdrawModalOpen(false)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#64748b",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestWithdrawal} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ padding: "12px 14px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>Available Balance</span>
                <span style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f" }}>₹{walletBalance.toLocaleString("en-IN")}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f" }}>Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 25000"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "#0a0a0f",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f" }}>Notes / Bank Remarks (Optional)</label>
                <input
                  placeholder="e.g. Venue Rental Settlement - HDFC"
                  value={withdrawDescription}
                  onChange={e => setWithdrawDescription(e.target.value)}
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#0a0a0f",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  style={{
                    flex: 1,
                    height: "42px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                    color: "#0a0a0f",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawing}
                  style={{
                    flex: 1,
                    height: "42px",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#0a0a0f",
                    color: "#c6ff3d",
                    fontWeight: 900,
                    fontSize: "13px",
                    cursor: withdrawing ? "not-allowed" : "pointer",
                  }}
                >
                  {withdrawing ? "Processing..." : "Confirm Payout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
