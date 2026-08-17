"use client";

import React, { useState } from "react";
import {
  Users,
  Music,
  Calendar,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  FileText,
  Activity,
  Percent,
  CheckCircle2,
  XCircle,
  Star,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Eye,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminDashboardPage() {
  const [approvals, setApprovals] = useState([
    { id: "1", name: "The Metal Core", type: "Band", email: "metal@core.in", time: "10 min ago", city: "Hyderabad" },
    { id: "2", name: "Royal Plaza Turf", type: "Venue", email: "plaza@royal.com", time: "1 hour ago", city: "Bengaluru" },
    { id: "3", name: "Jazz Elements Trio", type: "Band", email: "elements@jazz.org", time: "2 hours ago", city: "Chennai" },
  ]);

  const handleApprove = (id, name) => {
    setApprovals((prev) => prev.filter((item) => item.id !== id));
    toast.success(`Approved verification for: ${name}`);
  };

  const handleDecline = (id, name) => {
    setApprovals((prev) => prev.filter((item) => item.id !== id));
    toast.error(`Declined profile: ${name}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", width: "100%" }}>
      {/* ── TOP EXECUTIVE BANNER ── */}
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
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
            <span>Super Admin Governance Control</span>
          </div>

          <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.03em", margin: 0 }}>
            Marketplace Overview & Analytics
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: 500 }}>
            Real-time platform GMV volume, escrow cash held, provider onboarding queues, and commission ledger.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => toast.success("Exporting platform audit PDF report...")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              borderRadius: "14px",
              backgroundColor: "#ffffff",
              color: "#0a0a0f",
              fontWeight: 800,
              fontSize: "13px",
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            <FileText style={{ width: "16px", height: "16px", color: "#64748b" }} />
            <span>Export Report</span>
          </button>

          <button
            type="button"
            onClick={() => toast.success("System integrity check: 100% Operational")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              borderRadius: "14px",
              backgroundColor: "#0a0a0f",
              color: "#c6ff3d",
              fontWeight: 800,
              fontSize: "13px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <Activity style={{ width: "16px", height: "16px" }} />
            <span>System Health</span>
          </button>
        </div>
      </div>

      {/* ── 4-GRID PRIMARY FINANCIAL METRIC CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
        {/* Card 1: Escrow Cash Held */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "2px solid #c6ff3d", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "140px", boxShadow: "0 4px 16px rgba(198, 255, 61, 0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#0a0a0f" }}>
              Escrow Cash Held
            </span>
            <div style={{ width: "38px", height: "38px", borderRadius: "12px", backgroundColor: "#0a0a0f", color: "#c6ff3d", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IndianRupee style={{ width: "20px", height: "20px" }} />
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
              ₹18,40,500
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981", marginTop: "6px", display: "block" }}>
              +15.2% active locking volume
            </span>
          </div>
        </div>

        {/* Card 2: Net Platform Revenue */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "140px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
              Platform Revenue
            </span>
            <div style={{ width: "38px", height: "38px", borderRadius: "12px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp style={{ width: "20px", height: "20px" }} />
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
              ₹4,85,000
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981", marginTop: "6px", display: "block" }}>
              10% net commission earnings
            </span>
          </div>
        </div>

        {/* Card 3: Total Gigs Completed */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "140px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
              Gigs Executed
            </span>
            <div style={{ width: "38px", height: "38px", borderRadius: "12px", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar style={{ width: "20px", height: "20px" }} />
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
              5,640
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#2563eb", marginTop: "6px", display: "block" }}>
              +18.9% month-on-month
            </span>
          </div>
        </div>

        {/* Card 4: Registered Users */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "140px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
              Registered Profiles
            </span>
            <div style={{ width: "38px", height: "38px", borderRadius: "12px", backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users style={{ width: "20px", height: "20px" }} />
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
              12,450
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginTop: "6px", display: "block" }}>
              Across 6 metro cities
            </span>
          </div>
        </div>
      </div>

      {/* ── 2-COLUMN: REVENUE CHART + KYC APPROVAL QUEUE ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px", alignItems: "start" }}>
        
        {/* ── LEFT: REVENUE GROWTH & COMMISSION BARS ── */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "32px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                Platform GMV & Volume Growth
              </h2>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
                Monthly event transaction volume in Lakhs (INR)
              </p>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", backgroundColor: "#c6ff3d", padding: "4px 10px", borderRadius: "9999px" }}>
              10% Take-Rate
            </span>
          </div>

          {/* Visual Bar Chart */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "190px", paddingTop: "20px", gap: "14px" }}>
            {[
              { month: "Jan", val: 12, label: "₹12L" },
              { month: "Feb", val: 16, label: "₹16L" },
              { month: "Mar", val: 19, label: "₹19L" },
              { month: "Apr", val: 24, label: "₹24L" },
              { month: "May", val: 28, label: "₹28L" },
              { month: "Jun", val: 38, label: "₹38L" },
            ].map((pt, idx) => (
              <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#0a0a0f" }}>
                  {pt.label}
                </span>
                <div
                  style={{
                    width: "100%",
                    height: `${(pt.val / 40) * 100}%`,
                    backgroundColor: idx === 5 ? "#c6ff3d" : "#0a0a0f",
                    borderRadius: "10px",
                    transition: "all 0.3s ease",
                  }}
                />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                  {pt.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: PROVIDER KYC ONBOARDING QUEUE ── */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "32px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                Pending Verification Desk
              </h2>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
                Artist & venue owner onboarding review
              </p>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 900, color: "#d97706", backgroundColor: "rgba(245, 158, 11, 0.1)", padding: "4px 10px", borderRadius: "9999px" }}>
              {approvals.length} Pending
            </span>
          </div>

          {/* Approvals List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {approvals.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                🎉 All pending applications have been reviewed!
              </div>
            ) : (
              approvals.map((app) => (
                <div
                  key={app.id}
                  style={{
                    padding: "16px 20px",
                    borderRadius: "18px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "14px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 900, color: "#0a0a0f" }}>
                        {app.name}
                      </span>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "10px",
                          fontWeight: 800,
                          backgroundColor: app.type === "Band" ? "#0a0a0f" : "rgba(37,99,235,0.1)",
                          color: app.type === "Band" ? "#c6ff3d" : "#2563eb",
                        }}
                      >
                        {app.type}
                      </span>
                    </div>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                      {app.email} • {app.city} • {app.time}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleApprove(app.id, app.name)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "10px",
                        backgroundColor: "#c6ff3d",
                        color: "#0a0a0f",
                        fontWeight: 900,
                        fontSize: "12px",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <CheckCircle2 style={{ width: "14px", height: "14px" }} />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecline(app.id, app.name)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        backgroundColor: "#fee2e2",
                        color: "#b91c1c",
                        fontWeight: 800,
                        fontSize: "12px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── 3-COLUMN: TOP RATED PROFILES + LATEST REGISTRATIONS + COMMISSION RULES ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
        
        {/* Box 1: Platform Rating & Reviews */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
            Platform Trust & Ratings
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontSize: "36px", fontWeight: 900, color: "#0a0a0f" }}>4.85</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", color: "#fbbf24" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} style={{ width: "16px", height: "16px", fill: "#fbbf24" }} />
                ))}
              </div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>148 Verified Gig Reviews</span>
            </div>
          </div>
        </div>

        {/* Box 2: Latest Registered Accounts */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
            Latest User Signups
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { name: "Sarah Connor", role: "Client", time: "5m ago" },
              { name: "The Deccan Strings", role: "Artist", time: "12m ago" },
              { name: "Velvet Amphitheater", role: "Venue", time: "45m ago" },
            ].map((u, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ fontWeight: 800, color: "#0a0a0f" }}>{u.name}</span>
                <span style={{ color: "#64748b", fontSize: "11px" }}>{u.role} • {u.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Box 3: Commission Engine Status */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
            Escrow & Fee Policy
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Take-Rate Fee</span>
              <span style={{ fontWeight: 800, color: "#0a0a0f" }}>10% Flat</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Advance Lock</span>
              <span style={{ fontWeight: 800, color: "#10b981" }}>20% Escrow</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Auto-Release</span>
              <span style={{ fontWeight: 800, color: "#0a0a0f" }}>24 Hours Post-Gig</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
