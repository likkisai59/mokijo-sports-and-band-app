"use client";

import React, { useState, useEffect } from "react";
import {
  Music,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Download,
  Eye,
  MapPin,
  Sparkles,
  Users,
  IndianRupee,
  ShieldCheck,
  Star,
} from "lucide-react";
import bandApi from "@/lib/bandApi";
import toast from "react-hot-toast";

const SAMPLE_ARTISTS = [
  {
    id: 1,
    name: "The Deccan Strings",
    category: "Acoustic & Classical Fusion",
    members_count: 4,
    city: "Hyderabad",
    price_per_event: 45000,
    status: "approved",
    rating: 4.9,
    reviews_count: 24,
    created_at: "2026-07-15",
  },
  {
    id: 2,
    name: "Rhea Chakraborty Live",
    category: "Bollywood & Pop Vocalist",
    members_count: 1,
    city: "Mumbai",
    price_per_event: 35000,
    status: "pending",
    rating: 4.8,
    reviews_count: 12,
    created_at: "2026-08-14",
  },
  {
    id: 3,
    name: "Groove Syndicate",
    category: "Rock & Electric Ensemble",
    members_count: 5,
    city: "Bengaluru",
    price_per_event: 55000,
    status: "approved",
    rating: 5.0,
    reviews_count: 31,
    created_at: "2026-06-10",
  },
  {
    id: 4,
    name: "The Metal Core",
    category: "Heavy Metal & Progressive Rock",
    members_count: 4,
    city: "Hyderabad",
    price_per_event: 40000,
    status: "pending",
    rating: 4.7,
    reviews_count: 8,
    created_at: "2026-08-16",
  },
  {
    id: 5,
    name: "Acoustic Trio Elements",
    category: "Smooth Jazz & Blues",
    members_count: 3,
    city: "Chennai",
    price_per_event: 30000,
    status: "approved",
    rating: 4.9,
    reviews_count: 19,
    created_at: "2026-05-22",
  },
];

export default function AdminBandManagementPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [artists, setArtists] = useState(SAMPLE_ARTISTS);

  const handleApprove = (id, name) => {
    setArtists((prev) => prev.map((a) => (a.id === id ? { ...a, status: "approved" } : a)));
    toast.success(`Artist verified & approved: ${name}`);
  };

  const handleDecline = (id, name) => {
    setArtists((prev) => prev.map((a) => (a.id === id ? { ...a, status: "rejected" } : a)));
    toast.error(`Artist listing declined: ${name}`);
  };

  const handleDelete = (id, name) => {
    setArtists((prev) => prev.filter((a) => a.id !== id));
    toast.error(`Removed artist: ${name}`);
  };

  const filteredArtists = artists.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const tabs = [
    { id: "all", label: "All Artists", count: artists.length },
    { id: "approved", label: "Verified & Live", count: artists.filter((a) => a.status === "approved").length },
    { id: "pending", label: "Pending KYC", count: artists.filter((a) => a.status === "pending").length },
  ];

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
            <span>Performer & Artist Governance</span>
          </div>

          <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.03em", margin: 0 }}>
            Artists & Live Bands Audits
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: 500 }}>
            Review live music group profiles, audit sound samples, and manage artist verification approvals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.success("Exporting artists database to CSV...")}
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
          <Download style={{ width: "16px", height: "16px" }} />
          <span>Export Artists CSV</span>
        </button>
      </div>

      {/* ── FILTER TABS ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          overflowX: "auto",
          paddingBottom: "8px",
          borderBottom: "1px solid rgba(10, 10, 15, 0.08)",
        }}
      >
        {tabs.map((t) => {
          const active = statusFilter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "14px",
                fontSize: "13px",
                fontWeight: 800,
                border: active ? "1px solid #0a0a0f" : "1px solid #e2e8f0",
                backgroundColor: active ? "#0a0a0f" : "#ffffff",
                color: active ? "#c6ff3d" : "#5c5c66",
                cursor: "pointer",
                boxShadow: active ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span>{t.label}</span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: 900,
                  backgroundColor: active ? "rgba(198, 255, 61, 0.2)" : "#f1f5f9",
                  color: active ? "#c6ff3d" : "#64748b",
                }}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SEARCH BAR ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid rgba(10, 10, 15, 0.08)",
          padding: "20px 24px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#94a3b8" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artist name, genre, or city..."
            style={{
              width: "100%",
              padding: "12px 16px 12px 42px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
              fontWeight: 600,
              color: "#0a0a0f",
              boxSizing: "border-box",
              backgroundColor: "#f8fafc",
            }}
          />
        </div>
      </div>

      {/* ── ARTISTS TABLE CARD ── */}
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
                <th style={{ padding: "16px 24px" }}>Performer / Band</th>
                <th style={{ padding: "16px 20px" }}>Genre / Category</th>
                <th style={{ padding: "16px 20px" }}>Location</th>
                <th style={{ padding: "16px 20px" }}>Fee Estimate</th>
                <th style={{ padding: "16px 20px" }}>Rating</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                <th style={{ padding: "16px 24px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArtists.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
                    No artists matching your search filters.
                  </td>
                </tr>
              ) : (
                filteredArtists.map((a) => (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    {/* Performer */}
                    <td style={{ padding: "18px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "12px",
                            backgroundColor: "#0a0a0f",
                            color: "#c6ff3d",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Music style={{ width: "20px", height: "20px" }} />
                        </div>
                        <div>
                          <span style={{ fontWeight: 800, color: "#0a0a0f", display: "block", fontSize: "14px" }}>
                            {a.name}
                          </span>
                          <span style={{ color: "#64748b", fontSize: "12px" }}>{a.members_count} Members</span>
                        </div>
                      </div>
                    </td>

                    {/* Genre */}
                    <td style={{ padding: "18px 20px" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 800,
                          backgroundColor: "#f1f5f9",
                          color: "#0a0a0f",
                        }}
                      >
                        {a.category}
                      </span>
                    </td>

                    {/* Location */}
                    <td style={{ padding: "18px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0a0a0f", fontWeight: 700 }}>
                        <MapPin style={{ width: "14px", height: "14px", color: "#64748b", flexShrink: 0 }} />
                        <span>{a.city}</span>
                      </div>
                    </td>

                    {/* Price */}
                    <td style={{ padding: "18px 20px" }}>
                      <span style={{ fontWeight: 900, color: "#0a0a0f", display: "block" }}>
                        ₹{a.price_per_event.toLocaleString("en-IN")}
                      </span>
                      <span style={{ fontSize: "10px", color: "#64748b" }}>Starting gig rate</span>
                    </td>

                    {/* Rating */}
                    <td style={{ padding: "18px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0a0a0f", fontWeight: 800 }}>
                        <Star style={{ width: "14px", height: "14px", fill: "#fbbf24", color: "#fbbf24" }} />
                        <span>{a.rating}</span>
                        <span style={{ color: "#64748b", fontSize: "11px", fontWeight: 500 }}>({a.reviews_count})</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "18px 20px" }}>
                      {a.status === "approved" ? (
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
                          <span>100% Verified</span>
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
                            color: "#d97706",
                            backgroundColor: "rgba(245, 158, 11, 0.1)",
                          }}
                        >
                          <ShieldCheck style={{ width: "13px", height: "13px" }} />
                          <span>Pending KYC</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "18px 24px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        {a.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(a.id, a.name)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                backgroundColor: "#c6ff3d",
                                color: "#0a0a0f",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "11px",
                                fontWeight: 800,
                              }}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecline(a.id, a.name)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                backgroundColor: "#fee2e2",
                                color: "#b91c1c",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "11px",
                                fontWeight: 800,
                              }}
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDecline(a.id, a.name)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              backgroundColor: "#f8fafc",
                              color: "#64748b",
                              border: "1px solid #e2e8f0",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            Suspend
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(a.id, a.name)}
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

    </div>
  );
}
