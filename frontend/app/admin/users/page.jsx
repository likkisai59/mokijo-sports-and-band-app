"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Download,
  Eye,
  Calendar,
  Mail,
  ShieldCheck,
  Sparkles,
  Filter,
  ArrowUpDown,
  Building2,
  Music,
  UserCheck,
  UserX,
} from "lucide-react";
import bandApi from "@/lib/bandApi";
import toast from "react-hot-toast";

const SAMPLE_USERS = [
  {
    id: 1,
    name: "Sarah Connor",
    email: "sarah.connor@events.in",
    role: "client",
    is_active: true,
    is_verified: true,
    created_at: "2026-08-10",
    phone: "+91 98490 11223",
    city: "Hyderabad",
    total_bookings: 3,
  },
  {
    id: 2,
    name: "The Deccan Strings",
    email: "deccan.strings@bandconnect.in",
    role: "artist",
    is_active: true,
    is_verified: true,
    created_at: "2026-07-15",
    phone: "+91 99887 66554",
    city: "Hyderabad",
    total_bookings: 8,
  },
  {
    id: 3,
    name: "Velvet Amphitheater",
    email: "events@velvetamphitheater.com",
    role: "venue_owner",
    is_active: true,
    is_verified: true,
    created_at: "2026-06-20",
    phone: "+91 91234 56780",
    city: "Bengaluru",
    total_bookings: 14,
  },
  {
    id: 4,
    name: "Rhea Chakraborty Live",
    email: "rhea.live@music.in",
    role: "artist",
    is_active: true,
    is_verified: false,
    created_at: "2026-08-14",
    phone: "+91 94455 66778",
    city: "Mumbai",
    total_bookings: 1,
  },
  {
    id: 5,
    name: "Skyline Rooftop Lounge",
    email: "manager@skylinehyderabad.in",
    role: "venue_owner",
    is_active: true,
    is_verified: true,
    created_at: "2026-05-12",
    phone: "+91 98877 11223",
    city: "Hyderabad",
    total_bookings: 6,
  },
  {
    id: 6,
    name: "Groove Syndicate",
    email: "groove@syndicateband.com",
    role: "artist",
    is_active: true,
    is_verified: true,
    created_at: "2026-07-02",
    phone: "+91 97788 33445",
    city: "Bengaluru",
    total_bookings: 5,
  },
  {
    id: 7,
    name: "Aarav Patel",
    email: "aarav.patel@techcorp.in",
    role: "client",
    is_active: true,
    is_verified: true,
    created_at: "2026-08-01",
    phone: "+91 96655 44332",
    city: "Bengaluru",
    total_bookings: 2,
  },
  {
    id: 8,
    name: "Super Admin",
    email: "admin@bandconnect.in",
    role: "admin",
    is_active: true,
    is_verified: true,
    created_at: "2026-01-01",
    phone: "+91 99999 88888",
    city: "Hyderabad",
    total_bookings: 0,
  },
];

export default function UserManagementPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState(SAMPLE_USERS);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const res = await bandApi.get("/auth/me");
        // Maintain rich data list
      } catch (err) {
        console.warn("Using sample user dataset:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const handleToggleVerification = (id, name, currentStatus) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_verified: !currentStatus } : u))
    );
    toast.success(
      !currentStatus
        ? `Verified badge granted to ${name}`
        : `Verification revoked for ${name}`
    );
  };

  const handleToggleActive = (id, name, currentActive) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_active: !currentActive } : u))
    );
    toast.success(
      !currentActive ? `Account activated: ${name}` : `Account suspended: ${name}`
    );
  };

  const handleDeleteUser = (id, name) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.error(`Removed user: ${name}`);
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.city.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "verified" && u.is_verified) ||
      (statusFilter === "unverified" && !u.is_verified) ||
      (statusFilter === "active" && u.is_active) ||
      (statusFilter === "suspended" && !u.is_active);

    return matchSearch && matchRole && matchStatus;
  });

  const roleTabs = [
    { id: "all", label: "All Users", count: users.length },
    { id: "client", label: "Clients", count: users.filter((u) => u.role === "client").length },
    { id: "artist", label: "Artists & Bands", count: users.filter((u) => u.role === "artist").length },
    { id: "venue_owner", label: "Venue Hosts", count: users.filter((u) => u.role === "venue_owner").length },
    { id: "admin", label: "Admins", count: users.filter((u) => u.role === "admin").length },
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
            <span>User Accounts & KYC Administration</span>
          </div>

          <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.03em", margin: 0 }}>
            User Accounts Directory
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: 500 }}>
            Manage client, performer, and venue host credentials, toggle verified KYC badges, and enforce suspension controls.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.success("Exporting user database to CSV...")}
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
          <span>Export Users CSV</span>
        </button>
      </div>

      {/* ── ROLE FILTER TABS ── */}
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
        {roleTabs.map((t) => {
          const active = roleFilter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setRoleFilter(t.id)}
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

      {/* ── SEARCH & FILTER CONTROLS ── */}
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
            placeholder="Search account name, email, or city..."
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

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              color: "#0a0a0f",
              cursor: "pointer",
            }}
          >
            <option value="all">All Verification Statuses</option>
            <option value="verified">Verified KYC Only</option>
            <option value="unverified">Pending KYC Only</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* ── USERS TABLE CARD ── */}
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
                <th style={{ padding: "16px 24px" }}>Account User</th>
                <th style={{ padding: "16px 20px" }}>Role</th>
                <th style={{ padding: "16px 20px" }}>KYC Status</th>
                <th style={{ padding: "16px 20px" }}>Location</th>
                <th style={{ padding: "16px 20px" }}>Registered</th>
                <th style={{ padding: "16px 24px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
                    No users matching your search filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleBg =
                    u.role === "artist"
                      ? "rgba(16, 185, 129, 0.1)"
                      : u.role === "venue_owner"
                      ? "rgba(59, 130, 246, 0.1)"
                      : u.role === "admin"
                      ? "#0a0a0f"
                      : "#f1f5f9";
                  const roleColor =
                    u.role === "artist"
                      ? "#10b981"
                      : u.role === "venue_owner"
                      ? "#2563eb"
                      : u.role === "admin"
                      ? "#c6ff3d"
                      : "#64748b";

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {/* Name & Email */}
                      <td style={{ padding: "18px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "12px",
                              backgroundColor: "#0a0a0f",
                              color: "#c6ff3d",
                              fontWeight: 900,
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 800, color: "#0a0a0f", display: "block", fontSize: "14px" }}>
                              {u.name}
                            </span>
                            <span style={{ color: "#64748b", fontSize: "12px" }}>{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: "18px 20px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: 800,
                            backgroundColor: roleBg,
                            color: roleColor,
                            textTransform: "uppercase",
                          }}
                        >
                          {u.role.replace("_", " ")}
                        </span>
                      </td>

                      {/* KYC Status */}
                      <td style={{ padding: "18px 20px" }}>
                        {u.is_verified ? (
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
                            <XCircle style={{ width: "13px", height: "13px" }} />
                            <span>Pending KYC</span>
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td style={{ padding: "18px 20px", color: "#0a0a0f", fontWeight: 600 }}>
                        {u.city}
                      </td>

                      {/* Registered Date */}
                      <td style={{ padding: "18px 20px", color: "#64748b" }}>
                        {u.created_at}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "18px 24px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            title={u.is_verified ? "Revoke Verification" : "Grant Verified Badge"}
                            onClick={() => handleToggleVerification(u.id, u.name, u.is_verified)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              backgroundColor: u.is_verified ? "#f1f5f9" : "rgba(16,185,129,0.1)",
                              color: u.is_verified ? "#64748b" : "#10b981",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: 800,
                            }}
                          >
                            {u.is_verified ? "Unverify" : "Verify KYC"}
                          </button>

                          <button
                            type="button"
                            title={u.is_active ? "Suspend Account" : "Activate Account"}
                            onClick={() => handleToggleActive(u.id, u.name, u.is_active)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              backgroundColor: u.is_active ? "#f8fafc" : "#fee2e2",
                              color: u.is_active ? "#64748b" : "#b91c1c",
                              border: "1px solid #e2e8f0",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {u.is_active ? "Suspend" : "Activate"}
                          </button>

                          <button
                            type="button"
                            title="Remove User"
                            onClick={() => handleDeleteUser(u.id, u.name)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
