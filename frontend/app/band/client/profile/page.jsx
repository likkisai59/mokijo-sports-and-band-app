"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { getBandUser } from "@/lib/bandAuth";
import toast from "react-hot-toast";

export default function ClientProfilePage() {
  const { user } = useAuth();
  const bandUser = getBandUser();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "+91 98765 43210",
    organization: "Personal / Wedding Host",
    city: "Mumbai",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bandUser || user) {
      setFormData((prev) => ({
        ...prev,
        name: bandUser?.name || user?.name || "Client Organizer",
        email: bandUser?.email || user?.email || "client@bandconnect.live",
      }));
    }
  }, [bandUser, user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Profile details updated successfully!");
    }, 500);
  };

  return (
    <DashboardLayout role="client">
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "9999px", backgroundColor: "#0a0a0f", color: "#c6ff3d", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
            <User style={{ width: "13px", height: "13px" }} />
            <span>Event Host &amp; Organizer Profile</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
            Client Profile Management
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "32px", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#0a0a0f", fontWeight: 600, outline: "none", backgroundColor: "#f8fafc" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>Email Address *</label>
              <input
                type="email"
                value={formData.email}
                disabled
                style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#64748b", fontWeight: 600, outline: "none", backgroundColor: "#f1f5f9" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#0a0a0f", fontWeight: 600, outline: "none", backgroundColor: "#f8fafc" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textTransform: "uppercase" }}>Organization / Host Type</label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#0a0a0f", fontWeight: 600, outline: "none", backgroundColor: "#f8fafc" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              alignSelf: "flex-start",
              padding: "12px 24px",
              borderRadius: "12px",
              backgroundColor: "#c6ff3d",
              color: "#0a0a0f",
              fontWeight: 900,
              fontSize: "13px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(198, 255, 61, 0.4)",
            }}
          >
            {saving ? "Saving..." : "Save Profile Details"}
          </button>
        </form>

      </div>
    </DashboardLayout>
  );
}
