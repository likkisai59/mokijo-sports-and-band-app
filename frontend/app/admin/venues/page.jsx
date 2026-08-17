"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
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
  Music,
  Speaker,
} from "lucide-react";
import bandApi from "@/lib/bandApi";
import toast from "react-hot-toast";

const SAMPLE_VENUES = [
  {
    id: 1,
    name: "The Velvet Amphitheater",
    owner_name: "Vijay Kumar",
    owner_email: "vijay@velvetamphitheater.com",
    city: "Hyderabad",
    location: "Road No. 36, Jubilee Hills",
    capacity: 1200,
    price_per_hour: 15000,
    status: "approved",
    sound_rider: "Line Array Sound, 32-ch Digital Mixer, Stage Lighting Truss",
    created_at: "2026-06-20",
  },
  {
    id: 2,
    name: "Skyline Rooftop Lounge",
    owner_name: "Rahul Verma",
    owner_email: "manager@skylinehyderabad.in",
    city: "Hyderabad",
    location: "Financial District, Gachibowli",
    capacity: 350,
    price_per_hour: 8000,
    status: "approved",
    sound_rider: "Acoustic Stage, PA System, 4 Wireless Mics",
    created_at: "2026-07-05",
  },
  {
    id: 3,
    name: "Echo Underground Club",
    owner_name: "Vikram Sen",
    owner_email: "vikram@echoclub.in",
    city: "Bengaluru",
    location: "Indiranagar 100ft Road",
    capacity: 600,
    price_per_hour: 12000,
    status: "approved",
    sound_rider: "Bass Heavy Subwoofers, DJ Deck, Laser Rigs",
    created_at: "2026-05-18",
  },
  {
    id: 4,
    name: "Royal Arena & Banquet Turf",
    owner_name: "Karan Johar",
    owner_email: "plaza@royal.com",
    city: "Bengaluru",
    location: "Koramangala 4th Block",
    capacity: 2000,
    price_per_hour: 25000,
    status: "pending",
    sound_rider: "Outdoor Concert PA, Green Rooms, 3-Phase Power",
    created_at: "2026-08-15",
  },
  {
    id: 5,
    name: "Sound Garden Open Air",
    owner_name: "Ananya Rao",
    owner_email: "ananya@soundgarden.in",
    city: "Goa",
    location: "Vagator Hilltop",
    capacity: 1500,
    price_per_hour: 20000,
    status: "pending",
    sound_rider: "Full Festival Stage, Custom Monitors",
    created_at: "2026-08-16",
  },
];

export default function AdminVenueManagementPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [venues, setVenues] = useState(SAMPLE_VENUES);
  const [selectedVenue, setSelectedVenue] = useState(null);

  const handleApprove = (id, name) => {
    setUsersOrVenues(id, "approved");
    toast.success(`Venue approved & verified: ${name}`);
  };

  const handleDecline = (id, name) => {
    setUsersOrVenues(id, "rejected");
    toast.error(`Venue listing rejected: ${name}`);
  };

  const setUsersOrVenues = (id, status) => {
    setVenues((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
  };

  const handleDelete = (id, name) => {
    setVenues((prev) => prev.filter((v) => v.id !== id));
    toast.error(`Removed venue: ${name}`);
  };

  const filteredVenues = venues.filter((v) => {
    const matchSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase()) ||
      v.owner_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const tabs = [
    { id: "all", label: "All Venues", count: venues.length },
    { id: "approved", label: "Verified & Live", count: venues.filter((v) => v.status === "approved").length },
    { id: "pending", label: "Pending Review", count: venues.filter((v) => v.status === "pending").length },
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
            <span>Event Space & Venue Governance</span>
          </div>

          <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.03em", margin: 0 }}>
            Venue Space Audits & KYC
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: 500 }}>
            Inspect venue space profiles, review sound gear specifications, and approve host onboarding.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.success("Exporting venue database to CSV...")}
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
          <span>Export Venues CSV</span>
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
            placeholder="Search venue space name, city, or owner..."
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

      {/* ── VENUES TABLE CARD ── */}
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
                <th style={{ padding: "16px 24px" }}>Venue Space</th>
                <th style={{ padding: "16px 20px" }}>Location</th>
                <th style={{ padding: "16px 20px" }}>Capacity & Rates</th>
                <th style={{ padding: "16px 20px" }}>Sound Rider Specs</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                <th style={{ padding: "16px 24px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVenues.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
                    No venues matching your search filters.
                  </td>
                </tr>
              ) : (
                filteredVenues.map((v) => (
                  <tr
                    key={v.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    {/* Venue & Owner */}
                    <td style={{ padding: "18px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "12px",
                            backgroundColor: "rgba(59, 130, 246, 0.1)",
                            color: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Building2 style={{ width: "20px", height: "20px" }} />
                        </div>
                        <div>
                          <span style={{ fontWeight: 800, color: "#0a0a0f", display: "block", fontSize: "14px" }}>
                            {v.name}
                          </span>
                          <span style={{ color: "#64748b", fontSize: "12px" }}>Host: {v.owner_name}</span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td style={{ padding: "18px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0a0a0f", fontWeight: 700 }}>
                        <MapPin style={{ width: "14px", height: "14px", color: "#64748b", flexShrink: 0 }} />
                        <span>{v.city}</span>
                      </div>
                      <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "2px" }}>
                        {v.location}
                      </span>
                    </td>

                    {/* Capacity & Price */}
                    <td style={{ padding: "18px 20px" }}>
                      <span style={{ fontWeight: 800, color: "#0a0a0f", display: "block" }}>
                        {v.capacity.toLocaleString("en-IN")} Pax
                      </span>
                      <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>
                        ₹{v.price_per_hour.toLocaleString("en-IN")} / hr
                      </span>
                    </td>

                    {/* Sound Rider */}
                    <td style={{ padding: "18px 20px", maxWidth: "240px" }}>
                      <span style={{ fontSize: "12px", color: "#5c5c66", lineHeight: 1.4, display: "block" }}>
                        {v.sound_rider}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "18px 20px" }}>
                      {v.status === "approved" ? (
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
                          <span>Approved & Live</span>
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
                          <span>Pending Audit</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "18px 24px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        {v.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(v.id, v.name)}
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
                              onClick={() => handleDecline(v.id, v.name)}
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
                            onClick={() => handleDecline(v.id, v.name)}
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
                          onClick={() => handleDelete(v.id, v.name)}
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
