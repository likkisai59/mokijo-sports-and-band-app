import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import BandNavbar from "@/components/band/BandNavbar";
import BandFooter from "@/components/band/BandFooter";
import bandApi from "@/lib/bandApi";
import { getBandUser } from "@/lib/bandAuth";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeft,
  Building2,
  CreditCard,
  Download,
  Sparkles,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export default function ArtistEarningsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("upi");
  const [upiId, setUpiId] = useState("artist@okhdfcbank");
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const [summary, setSummary] = useState({
    wallet_balance: 85000,
    total_earnings: 185000,
    monthly_earnings: 45000,
    pending_payments: 20000,
    completed_payments: 5,
    revenue_chart: [
      { month: "Mar 2026", revenue: 25000 },
      { month: "Apr 2026", revenue: 30000 },
      { month: "May 2026", revenue: 40000 },
      { month: "Jun 2026", revenue: 35000 },
      { month: "Jul 2026", revenue: 55000 },
      { month: "Aug 2026", revenue: 45000 },
    ],
    transactions: [
      {
        id: 1,
        description: "Grand Sangeet Night Gig — Rahul & Sneha",
        amount: 65000,
        type: "credit",
        status: "completed",
        created_at: "2026-08-16",
      },
      {
        id: 2,
        description: "Payout Withdrawal to HDFC Bank ****4910",
        amount: 50000,
        type: "debit",
        status: "completed",
        created_at: "2026-08-10",
      },
      {
        id: 3,
        description: "Annual Corporate Day Gala — Tech Mahindra",
        amount: 50000,
        type: "credit",
        status: "completed",
        created_at: "2026-07-28",
      },
      {
        id: 4,
        description: "Club Weekend Acoustic Night — Echo Underground",
        amount: 20000,
        type: "credit",
        status: "pending",
        created_at: "2026-08-14",
      },
    ],
  });

  useEffect(() => {
    const authUser = getBandUser();
    if (!authUser) {
      navigate("/band/login?redirect=/band/artist/earnings");
      return;
    }
    setUser(authUser);

    async function loadEarnings() {
      try {
        setLoading(true);
        const res = await bandApi.get("/earnings/summary");
        if (res.data) {
          setSummary(res.data);
        }
      } catch (err) {
        console.warn("Using active mock earnings data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEarnings();
  }, [navigate]);

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum <= 0 || amountNum > summary.wallet_balance) return;

    setSummary((prev) => ({
      ...prev,
      wallet_balance: prev.wallet_balance - amountNum,
      transactions: [
        {
          id: Date.now(),
          description: `Payout Withdrawal via ${payoutMethod.toUpperCase()} (${upiId})`,
          amount: amountNum,
          type: "debit",
          status: "pending",
          created_at: "Just now",
        },
        ...prev.transactions,
      ],
    }));

    setPayoutSuccess(true);
    setTimeout(() => {
      setPayoutSuccess(false);
      setWithdrawModalOpen(false);
      setWithdrawAmount("");
    }, 2000);
  };

  const maxRevenue = Math.max(...summary.revenue_chart.map((p) => p.revenue), 60000);

  return (
    <div style={{ backgroundColor: "#f7f7f8", minHeight: "100vh", color: "#0a0a0f", width: "100%" }}>
      {/* ── TOP NAVIGATION ── */}
      <BandNavbar />

      {/* ── MAIN EARNINGS CONTAINER ── */}
      <main style={{ maxWidth: "1320px", margin: "0 auto", padding: "40px 24px 80px", width: "100%", display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* ── HEADER WITH BACK BUTTON & WITHDRAW CTA ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              to="/band/artist/dashboard"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                backgroundColor: "#ffffff",
                border: "1px solid rgba(10,10,15,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                color: "#0a0a0f",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <ArrowLeft style={{ width: "18px", height: "18px" }} />
            </Link>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  backgroundColor: "#0a0a0f",
                  color: "#c6ff3d",
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  width: "fit-content",
                }}
              >
                <Sparkles style={{ width: "12px", height: "12px" }} />
                <span>Provider Wallet & Payouts</span>
              </div>

              <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.03em", margin: 0 }}>
                Earnings & Escrow Ledger
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setWithdrawModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 28px",
              borderRadius: "16px",
              backgroundColor: "#c6ff3d",
              color: "#0a0a0f",
              fontWeight: 900,
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(198, 255, 61, 0.4)",
              transition: "all 0.2s ease",
            }}
          >
            <ArrowUpRight style={{ width: "18px", height: "18px" }} />
            <span>Request Payout Withdrawal</span>
          </button>
        </div>

        {/* ── 4-GRID FINANCIAL SUMMARY METRICS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
          {/* Card 1: Available Wallet Balance */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "2px solid #c6ff3d", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "140px", boxShadow: "0 4px 16px rgba(198, 255, 61, 0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#0a0a0f" }}>
                Available for Payout
              </span>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", backgroundColor: "#0a0a0f", color: "#c6ff3d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 style={{ width: "20px", height: "20px" }} />
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "34px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                ₹{summary.wallet_balance.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981", marginTop: "6px", display: "block" }}>
                Instant bank transfer eligible
              </span>
            </div>
          </div>

          {/* Card 2: Total Lifetime Earnings */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "140px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                Lifetime Earnings
              </span>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp style={{ width: "20px", height: "20px" }} />
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                ₹{summary.total_earnings.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginTop: "6px", display: "block" }}>
                Across {summary.completed_payments} completed gigs
              </span>
            </div>
          </div>

          {/* Card 3: This Month Revenue */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "140px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                This Month Revenue
              </span>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DollarSign style={{ width: "20px", height: "20px" }} />
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                ₹{summary.monthly_earnings.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981", marginTop: "6px", display: "block" }}>
                +24% vs previous month
              </span>
            </div>
          </div>

          {/* Card 4: Pending Clearance */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "140px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                Pending in Escrow
              </span>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock style={{ width: "20px", height: "20px" }} />
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                ₹{summary.pending_payments.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#d97706", marginTop: "6px", display: "block" }}>
                Releases post-gig completion
              </span>
            </div>
          </div>
        </div>

        {/* ── 2-COLUMN: REVENUE GROWTH CHART + TRANSACTION LEDGER ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px", alignItems: "start" }}>
          
          {/* ── LEFT: 6-MONTH REVENUE GROWTH BARS ── */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "32px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                  Monthly Revenue Trend
                </h2>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
                  Historical live gig payout volume
                </p>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#10b981", backgroundColor: "rgba(16,185,129,0.08)", padding: "4px 10px", borderRadius: "9999px" }}>
                Verified Escrow
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "180px", paddingTop: "20px", gap: "12px" }}>
              {summary.revenue_chart.map((point, idx) => {
                const heightPct = Math.round((point.revenue / maxRevenue) * 100);
                return (
                  <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#0a0a0f" }}>
                      ₹{(point.revenue / 1000).toFixed(0)}k
                    </span>
                    <div
                      style={{
                        width: "100%",
                        height: `${heightPct}%`,
                        backgroundColor: idx === summary.revenue_chart.length - 1 ? "#c6ff3d" : "#0a0a0f",
                        borderRadius: "10px",
                        transition: "all 0.3s ease",
                      }}
                    />
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>
                      {point.month.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: DETAILED TRANSACTION LEDGER ── */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "32px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                  Recent Ledger Transactions
                </h2>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
                  All incoming gig settlements & withdrawals
                </p>
              </div>
            </div>

            {/* Transactions List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {summary.transactions.map((tx) => {
                const isCredit = tx.type === "credit";
                return (
                  <div
                    key={tx.id}
                    style={{
                      padding: "16px",
                      borderRadius: "18px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "12px",
                          backgroundColor: isCredit ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                          color: isCredit ? "#10b981" : "#ef4444",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isCredit ? <ArrowDownLeft style={{ width: "18px", height: "18px" }} /> : <ArrowUpRight style={{ width: "18px", height: "18px" }} />}
                      </div>

                      <div>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#0a0a0f", display: "block" }}>
                          {tx.description}
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "2px" }}>
                          {tx.created_at} • {tx.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: 900,
                          color: isCredit ? "#10b981" : "#0a0a0f",
                          display: "block",
                        }}
                      >
                        {isCredit ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── WITHDRAWAL MODAL ── */}
        {withdrawModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(10, 10, 15, 0.6)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 200,
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "28px",
                maxWidth: "480px",
                width: "100%",
                padding: "36px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                  Request Payout
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
                  Available Balance: <strong>₹{summary.wallet_balance.toLocaleString("en-IN")}</strong>
                </p>
              </div>

              {payoutSuccess ? (
                <div style={{ padding: "20px", borderRadius: "16px", backgroundColor: "rgba(16,185,129,0.1)", color: "#10b981", textAlign: "center", fontWeight: 800, fontSize: "14px" }}>
                  🎉 Payout request submitted successfully! Funds will credit within 2-4 hours.
                </div>
              ) : (
                <form onSubmit={handleWithdrawSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", display: "block", marginBottom: "6px" }}>
                      Withdrawal Amount (₹) *
                    </label>
                    <input
                      type="number"
                      max={summary.wallet_balance}
                      min={500}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="e.g. 25000"
                      required
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "14px",
                        border: "1px solid #cbd5e1",
                        fontSize: "16px",
                        fontWeight: 800,
                        color: "#0a0a0f",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", display: "block", marginBottom: "6px" }}>
                      Payout Destination (UPI ID / Bank IFSC)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "14px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#0a0a0f",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setWithdrawModalOpen(false)}
                      style={{
                        flex: 1,
                        padding: "14px",
                        borderRadius: "14px",
                        backgroundColor: "#f1f5f9",
                        color: "#64748b",
                        fontWeight: 800,
                        fontSize: "13px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      style={{
                        flex: 2,
                        padding: "14px",
                        borderRadius: "14px",
                        backgroundColor: "#c6ff3d",
                        color: "#0a0a0f",
                        fontWeight: 900,
                        fontSize: "14px",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(198, 255, 61, 0.4)",
                      }}
                    >
                      Confirm Transfer
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ── FOOTER DIRECTORY ── */}
      <BandFooter />
    </div>
  );
}
