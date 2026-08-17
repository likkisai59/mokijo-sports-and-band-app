"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Percent,
  IndianRupee,
  Calendar,
  CheckCircle2,
  XCircle,
  Trash2,
  Download,
  Sparkles,
  Search,
  Filter,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import bandApi from "@/lib/bandApi";

const INITIAL_PROMOS = [
  {
    id: 1,
    code: "SUMMERGIG20",
    description: "20% off on all wedding & corporate band bookings",
    discount_type: "percentage",
    discount_value: 20,
    min_order_amount: 30000,
    max_discount_cap: 10000,
    max_uses: 100,
    used_count: 34,
    is_active: true,
    expires_at: "2026-09-30",
  },
  {
    id: 2,
    code: "FLAT5000",
    description: "Flat ₹5,000 off on arena concert bookings above ₹50,000",
    discount_type: "flat",
    discount_value: 5000,
    min_order_amount: 50000,
    max_discount_cap: 5000,
    max_uses: 50,
    used_count: 18,
    is_active: true,
    expires_at: "2026-10-15",
  },
  {
    id: 3,
    code: "WELCOMEBAND",
    description: "10% Welcome discount for new event organizers",
    discount_type: "percentage",
    discount_value: 10,
    min_order_amount: 15000,
    max_discount_cap: 3000,
    max_uses: 500,
    used_count: 142,
    is_active: true,
    expires_at: "2026-12-31",
  },
  {
    id: 4,
    code: "MONSOONFEST",
    description: "Special monsoon live lounge promotional campaign",
    discount_type: "percentage",
    discount_value: 15,
    min_order_amount: 25000,
    max_discount_cap: 5000,
    max_uses: 40,
    used_count: 40,
    is_active: false,
    expires_at: "2026-08-01",
  },
];

export default function AdminPromosPage() {
  const [promos, setPromos] = useState(INITIAL_PROMOS);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxDiscountCap, setMaxDiscountCap] = useState("");
  const [maxUses, setMaxUses] = useState("100");
  const [expiresAt, setExpiresAt] = useState("2026-12-31");

  const handleToggleActive = (id, currentStatus) => {
    setPromos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p))
    );
    toast.success(
      !currentStatus
        ? "Promo coupon activated successfully!"
        : "Promo coupon suspended."
    );
  };

  const handleDeletePromo = (id, promoCode) => {
    setPromos((prev) => prev.filter((p) => p.id !== id));
    toast.error(`Deleted coupon '${promoCode}'`);
  };

  const handleCreatePromo = (e) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast.error("Please enter coupon code and discount value.");
      return;
    }

    const newPromo = {
      id: Date.now(),
      code: code.trim().toUpperCase(),
      description: description.trim() || "Promotional booking discount",
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      min_order_amount: parseFloat(minOrder) || 0,
      max_discount_cap: maxDiscountCap ? parseFloat(maxDiscountCap) : null,
      max_uses: parseInt(maxUses) || 100,
      used_count: 0,
      is_active: true,
      expires_at: expiresAt,
    };

    setPromos((prev) => [newPromo, ...prev]);
    setModalOpen(false);
    setCode("");
    setDescription("");
    setDiscountValue("");
    setMinOrder("");
    setMaxDiscountCap("");
    toast.success(`Coupon '${newPromo.code}' created successfully!`);
  };

  const filteredPromos = promos.filter(
    (p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

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
            <span>Growth & Discount Engine</span>
          </div>

          <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.03em", margin: 0 }}>
            Promotional Coupons & Discounts
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: 500 }}>
            Create dynamic discount coupons, enforce minimum booking order thresholds, and monitor campaign redemptions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "14px 24px",
            borderRadius: "16px",
            backgroundColor: "#0a0a0f",
            color: "#c6ff3d",
            fontWeight: 800,
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
        >
          <Plus style={{ width: "18px", height: "18px" }} />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* ── KPI METRICS CARDS ── */}
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
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
            Active Promo Codes
          </span>
          <span style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", display: "block", marginTop: "6px" }}>
            {promos.filter((p) => p.is_active).length}
          </span>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "24px",
            borderRadius: "24px",
            border: "1px solid rgba(10, 10, 15, 0.08)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
            Total Redemptions
          </span>
          <span style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", display: "block", marginTop: "6px" }}>
            {promos.reduce((acc, curr) => acc + curr.used_count, 0)}
          </span>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "24px",
            borderRadius: "24px",
            border: "1px solid rgba(10, 10, 15, 0.08)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
            GMV Boost Generated
          </span>
          <span style={{ fontSize: "28px", fontWeight: 900, color: "#10b981", display: "block", marginTop: "6px" }}>
            +24.6%
          </span>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid rgba(10, 10, 15, 0.08)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
          <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#94a3b8" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coupon code or campaign..."
            style={{
              width: "100%",
              padding: "10px 14px 10px 40px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
              fontWeight: 600,
              backgroundColor: "#f8fafc",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* ── PROMO CODES TABLE ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "28px",
          border: "1px solid rgba(10, 10, 15, 0.08)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 800, textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em" }}>
                <th style={{ padding: "16px 24px" }}>Coupon Code</th>
                <th style={{ padding: "16px 20px" }}>Discount Value</th>
                <th style={{ padding: "16px 20px" }}>Min Booking / Cap</th>
                <th style={{ padding: "16px 20px" }}>Redemptions</th>
                <th style={{ padding: "16px 20px" }}>Expiry Date</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                <th style={{ padding: "16px 24px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromos.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
                    No promo codes matching your search.
                  </td>
                </tr>
              ) : (
                filteredPromos.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    {/* Code & Desc */}
                    <td style={{ padding: "18px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            padding: "6px 12px",
                            borderRadius: "10px",
                            backgroundColor: "#0a0a0f",
                            color: "#c6ff3d",
                            fontWeight: 900,
                            fontSize: "13px",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {p.code}
                        </div>
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                          {p.description}
                        </span>
                      </div>
                    </td>

                    {/* Discount Value */}
                    <td style={{ padding: "18px 20px" }}>
                      <span style={{ fontWeight: 900, color: "#0a0a0f", fontSize: "15px" }}>
                        {p.discount_type === "percentage" ? `${p.discount_value}% OFF` : `₹${p.discount_value.toLocaleString("en-IN")} FLAT`}
                      </span>
                    </td>

                    {/* Min Booking & Cap */}
                    <td style={{ padding: "18px 20px" }}>
                      <span style={{ fontWeight: 700, color: "#0a0a0f", display: "block" }}>
                        Min ₹{p.min_order_amount.toLocaleString("en-IN")}
                      </span>
                      {p.max_discount_cap && (
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          Max cap: ₹{p.max_discount_cap.toLocaleString("en-IN")}
                        </span>
                      )}
                    </td>

                    {/* Redemptions */}
                    <td style={{ padding: "18px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 800, color: "#0a0a0f" }}>{p.used_count}</span>
                        <span style={{ color: "#94a3b8" }}>/ {p.max_uses} used</span>
                      </div>
                    </td>

                    {/* Expiry */}
                    <td style={{ padding: "18px 20px", color: "#64748b", fontWeight: 600 }}>
                      {p.expires_at}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "18px 20px" }}>
                      {p.is_active ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 10px",
                            borderRadius: "9999px",
                            fontSize: "11px",
                            fontWeight: 800,
                            color: "#10b981",
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                          }}
                        >
                          <CheckCircle2 style={{ width: "13px", height: "13px" }} />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 10px",
                            borderRadius: "9999px",
                            fontSize: "11px",
                            fontWeight: 800,
                            color: "#64748b",
                            backgroundColor: "#f1f5f9",
                          }}
                        >
                          <XCircle style={{ width: "13px", height: "13px" }} />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "18px 24px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p.id, p.is_active)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            backgroundColor: p.is_active ? "#f8fafc" : "#0a0a0f",
                            color: p.is_active ? "#64748b" : "#c6ff3d",
                            fontWeight: 700,
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          {p.is_active ? "Suspend" : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePromo(p.id, p.code)}
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "8px",
                            backgroundColor: "#fef2f2",
                            color: "#ef4444",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Trash2 style={{ width: "14px", height: "14px" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE COUPON MODAL ── */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10,10,15,0.6)",
            backdropFilter: "blur(6px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "28px",
              padding: "32px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles style={{ width: "20px", height: "20px", color: "#c6ff3d" }} />
                <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                  Create Promo Coupon
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ backgroundColor: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "18px", fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromo} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Coupon Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVAL30"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "14px",
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Campaign Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 30% off for festival bookings"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      fontWeight: 700,
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Cash (₹)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Value ({discountType === "percentage" ? "%" : "₹"})
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "percentage" ? "20" : "5000"}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      fontWeight: 800,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Min Booking Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    placeholder="25000"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={maxDiscountCap}
                    onChange={(e) => setMaxDiscountCap(e.target.value)}
                    placeholder="10000"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: "14px",
                    backgroundColor: "#0a0a0f",
                    color: "#c6ff3d",
                    fontSize: "13px",
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Publish Coupon
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: "14px 20px",
                    borderRadius: "14px",
                    backgroundColor: "#f1f5f9",
                    color: "#64748b",
                    fontSize: "13px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
