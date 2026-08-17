"use client";

import React, { useState } from "react";
import {
  BarChart2,
  FileSpreadsheet,
  Download,
  IndianRupee,
  Calendar,
  Sparkles,
  TrendingUp,
  MapPin,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

const MONTHLY_FINANCIALS = [
  { month: "Jan 2026", gmv: 1250000, take_rate_10: 125000, gst_18: 22500, gigs: 142 },
  { month: "Feb 2026", gmv: 1540000, take_rate_10: 154000, gst_18: 27720, gigs: 180 },
  { month: "Mar 2026", gmv: 1980000, take_rate_10: 198000, gst_18: 35640, gigs: 215 },
  { month: "Apr 2026", gmv: 2420000, take_rate_10: 242000, gst_18: 43560, gigs: 268 },
  { month: "May 2026", gmv: 2850000, take_rate_10: 285000, gst_18: 51300, gigs: 310 },
  { month: "Jun 2026", gmv: 3840000, take_rate_10: 384000, gst_18: 69120, gigs: 420 },
];

const CITY_DISTRIBUTION = [
  { city: "Hyderabad", percentage: 38, gmv: 1459200, active_artists: 86, color: "#10b981" },
  { city: "Bengaluru", percentage: 28, gmv: 1075200, active_artists: 74, color: "#3b82f6" },
  { city: "Mumbai", percentage: 18, gmv: 691200, active_artists: 52, color: "#f59e0b" },
  { city: "Chennai", percentage: 10, gmv: 384000, active_artists: 30, color: "#8b5cf6" },
  { city: "Goa", percentage: 6, gmv: 230400, active_artists: 22, color: "#ec4899" },
];

export default function AdminReportsPage() {
  const [selectedYear, setSelectedYear] = useState("2026");

  const totalGMV = MONTHLY_FINANCIALS.reduce((acc, curr) => acc + curr.gmv, 0);
  const totalRevenue = MONTHLY_FINANCIALS.reduce((acc, curr) => acc + curr.take_rate_10, 0);
  const totalGST = MONTHLY_FINANCIALS.reduce((acc, curr) => acc + curr.gst_18, 0);
  const totalGigs = MONTHLY_FINANCIALS.reduce((acc, curr) => acc + curr.gigs, 0);

  const handleExportGSTReport = () => {
    toast.success("Generating & downloading 18% GST Tax Summary Excel/CSV...");
  };

  const handleExportAuditSummary = () => {
    toast.success("Exporting platform executive audit ledger...");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", width: "100%" }}>
      {/* ── TOP HEADER ── */}
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
            <span>Financial Governance & GST Audit</span>
          </div>

          <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.03em", margin: 0 }}>
            Platform Reports & GST Ledger
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: 500 }}>
            Audit marketplace gross merchandise volume (GMV), 10% platform take-rate commission, and 18% statutory GST tax compliance.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleExportGSTReport}
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
            }}
          >
            <Download style={{ width: "16px", height: "16px" }} />
            <span>Export GST Invoices</span>
          </button>
        </div>
      </div>

      {/* ── 4 FINANCIAL KPI CARDS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "24px",
            borderRadius: "24px",
            border: "1px solid rgba(10, 10, 15, 0.08)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
            Total Marketplace GMV
          </span>
          <span style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", display: "block", marginTop: "6px" }}>
            ₹{(totalGMV / 100000).toFixed(2)} Lakhs
          </span>
          <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700, marginTop: "4px", display: "block" }}>
            +212% H1 YoY Growth
          </span>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "24px",
            borderRadius: "24px",
            border: "2px solid #0a0a0f",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
            Platform Revenue (10%)
          </span>
          <span style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", display: "block", marginTop: "6px" }}>
            ₹{(totalRevenue / 100000).toFixed(2)} Lakhs
          </span>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, marginTop: "4px", display: "block" }}>
            Direct net earnings
          </span>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "24px",
            borderRadius: "24px",
            border: "1px solid rgba(10, 10, 15, 0.08)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
            Statutory 18% GST Paid
          </span>
          <span style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", display: "block", marginTop: "6px" }}>
            ₹{totalGST.toLocaleString("en-IN")}
          </span>
          <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700, marginTop: "4px", display: "block" }}>
            100% Tax Compliant
          </span>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "24px",
            borderRadius: "24px",
            border: "1px solid rgba(10, 10, 15, 0.08)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
            Total Live Gigs Executed
          </span>
          <span style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", display: "block", marginTop: "6px" }}>
            {totalGigs.toLocaleString("en-IN")}
          </span>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, marginTop: "4px", display: "block" }}>
            Zero dispute escrow rate
          </span>
        </div>
      </div>

      {/* ── 2-COLUMN SECTION: MONTHLY FINANCIALS & CITY DISTRIBUTION ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
        {/* Monthly Breakdown Table */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "28px",
            border: "1px solid rgba(10, 10, 15, 0.08)",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                H1 2026 Financial Audit Ledger
              </h3>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Monthly volume, commission take-rate & GST</span>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 800, fontSize: "11px", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 16px" }}>Month</th>
                  <th style={{ padding: "12px 16px" }}>GMV (₹)</th>
                  <th style={{ padding: "12px 16px" }}>Take-Rate (10%)</th>
                  <th style={{ padding: "12px 16px" }}>GST (18%)</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Gigs</th>
                </tr>
              </thead>
              <tbody>
                {MONTHLY_FINANCIALS.map((m, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0a0a0f" }}>{m.month}</td>
                    <td style={{ padding: "14px 16px", color: "#0a0a0f", fontWeight: 700 }}>
                      ₹{m.gmv.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 800 }}>
                      ₹{m.take_rate_10.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b" }}>
                      ₹{m.gst_18.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: "#0a0a0f" }}>
                      {m.gigs}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* City Booking Volume Distribution */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "28px",
            border: "1px solid rgba(10, 10, 15, 0.08)",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Metro City Distribution
            </h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Regional GMV market penetration</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {CITY_DISTRIBUTION.map((c, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPin style={{ width: "14px", height: "14px", color: "#64748b" }} />
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#0a0a0f" }}>{c.city}</span>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 900, color: "#0a0a0f" }}>{c.percentage}%</span>
                </div>

                <div style={{ width: "100%", height: "8px", borderRadius: "9999px", backgroundColor: "#f1f5f9", overflow: "hidden" }}>
                  <div style={{ width: `${c.percentage}%`, height: "100%", backgroundColor: c.color, borderRadius: "9999px" }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "#64748b" }}>
                  <span>₹{(c.gmv / 100000).toFixed(1)}L GMV</span>
                  <span>{c.active_artists} Active Artists</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
