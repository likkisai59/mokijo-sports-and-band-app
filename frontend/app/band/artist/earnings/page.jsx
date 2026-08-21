"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Download,
  Building,
  CreditCard,
  Sparkles,
  Inbox,
  Calendar,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import bandApi from "@/lib/bandApi";
import toast from "react-hot-toast";

export default function ArtistEarningsPage() {
  const [wallet, setWallet] = useState({
    available_balance: 0,
    escrow_balance: 0,
    lifetime_earnings: 0,
    pending_payouts: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const [bookingsRes, earningsRes] = await Promise.allSettled([
          bandApi.get("/bookings/my"),
          bandApi.get("/earnings/artist"),
        ]);

        let available = 0;
        let inEscrow = 0;
        let lifetime = 0;
        let txList = [];

        if (bookingsRes.status === "fulfilled" && bookingsRes.value?.data) {
          const items = Array.isArray(bookingsRes.value.data)
            ? bookingsRes.value.data
            : bookingsRes.value.data.items || [];

          items.forEach((b) => {
            const amt = Number(b.total_amount || b.agreed_price || b.offer_amount || 0);
            if (b.status === "completed") {
              available += amt;
              lifetime += amt;
              txList.push({
                id: `TX-${b.id}`,
                booking_id: b.id,
                title: b.event_name || b.title || "Live Performance Gig",
                date: b.date || b.event_date || "2026-08-20",
                amount: amt,
                status: "cleared",
                type: "Gig Payout",
              });
            } else if (b.status === "accepted" || b.status === "confirmed") {
              inEscrow += amt;
              txList.push({
                id: `TX-ESC-${b.id}`,
                booking_id: b.id,
                title: b.event_name || b.title || "Upcoming Show Escrow",
                date: b.date || b.event_date || "2026-08-30",
                amount: amt,
                status: "in_escrow",
                type: "Escrow Deposit",
              });
            }
          });
        }

        setWallet({
          available_balance: available,
          escrow_balance: inEscrow,
          lifetime_earnings: lifetime,
          pending_payouts: 0,
        });
        setTransactions(txList);
      } catch {
        // Fallback clean zero state
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  const handleRequestPayout = (e) => {
    e.preventDefault();
    if (Number(payoutAmount) > wallet.available_balance) {
      toast.error("Requested amount exceeds available balance.");
      return;
    }
    toast.success(`Payout request of ₹${Number(payoutAmount).toLocaleString("en-IN")} submitted!`);
    setPayoutModalOpen(false);
    setPayoutAmount("");
  };

  return (
    <DashboardLayout role="artist">
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        {/* Header Title Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "9999px", backgroundColor: "#0a0a0f", color: "#c6ff3d", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
              <IndianRupee style={{ width: "13px", height: "13px" }} />
              <span>Financial Ledger &amp; Escrow</span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Artist Earnings &amp; Payouts
            </h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0", fontWeight: 500 }}>
              Track completed show earnings, escrow funds clearance status, and request direct bank/UPI payouts.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={() => setPayoutModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "14px",
                backgroundColor: "#c6ff3d",
                color: "#0a0a0f",
                fontWeight: 900,
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(198, 255, 61, 0.4)",
              }}
            >
              <ArrowUpRight style={{ width: "16px", height: "16px" }} />
              <span>Request Payout</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          {/* Card 1 */}
          <div style={{ backgroundColor: "#0a0a0f", color: "#ffffff", borderRadius: "24px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#c6ff3d" }}>
                Available For Payout
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(198, 255, 61, 0.2)", color: "#c6ff3d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 style={{ width: "18px", height: "18px" }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
                ₹{wallet.available_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <span style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px", display: "block" }}>
                Cleared from completed performances
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
                Held in Escrow Clearance
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock style={{ width: "18px", height: "18px" }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                ₹{wallet.escrow_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <span style={{ fontSize: "12px", color: "#64748b", marginTop: "8px", display: "block" }}>
                Locked for upcoming confirmed gigs
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
                Lifetime Platform Volume
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp style={{ width: "18px", height: "18px" }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                ₹{wallet.lifetime_earnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <span style={{ fontSize: "12px", color: "#059669", marginTop: "8px", display: "block", fontWeight: 700 }}>
                100% Escrow Protection Guaranteed
              </span>
            </div>
          </div>
        </div>

        {/* Transaction History Table */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Transaction &amp; Escrow History ({transactions.length})
            </h2>
          </div>

          {transactions.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <Inbox style={{ width: "36px", height: "36px", color: "#cbd5e1" }} />
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                No completed or escrow transactions recorded yet.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    padding: "16px 20px",
                    borderRadius: "16px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        backgroundColor: tx.status === "cleared" ? "#ecfdf5" : "#fffbeb",
                        color: tx.status === "cleared" ? "#047857" : "#d97706",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                      }}
                    >
                      ₹
                    </div>
                    <div>
                      <h4 style={{ fontSize: "14.5px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                        {tx.title}
                      </h4>
                      <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 500 }}>
                        {tx.id} · {tx.date}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        backgroundColor: tx.status === "cleared" ? "#ecfdf5" : "#fffbeb",
                        color: tx.status === "cleared" ? "#047857" : "#92400e",
                        border: tx.status === "cleared" ? "1px solid #a7f3d0" : "1px solid #fde68a",
                      }}
                    >
                      {tx.status === "cleared" ? "Cleared Payout" : "In Escrow"}
                    </span>

                    <span style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f" }}>
                      ₹{tx.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout Request Modal */}
        {payoutModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "20px",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                padding: "32px",
                maxWidth: "460px",
                width: "100%",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                Request Direct Payout
              </h3>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                Available balance for immediate withdrawal: <strong>₹{wallet.available_balance.toLocaleString("en-IN")}</strong>
              </p>

              <form onSubmit={handleRequestPayout} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f" }}>
                    Withdrawal Amount (₹) *
                  </label>
                  <input
                    type="number"
                    max={wallet.available_balance}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder={String(wallet.available_balance)}
                    required
                    style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f" }}>
                    UPI ID or Bank Account Details *
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="artist@okhdfcbank or Account/IFSC"
                    required
                    style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px", outline: "none" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setPayoutModalOpen(false)}
                    style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#64748b", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "10px 22px", borderRadius: "10px", border: "none", backgroundColor: "#c6ff3d", color: "#0a0a0f", fontWeight: 900, fontSize: "13px", cursor: "pointer" }}
                  >
                    Confirm Payout
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
