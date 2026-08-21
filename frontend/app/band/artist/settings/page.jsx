"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  KeyRound,
  Bell,
  CheckCircle2,
  Lock,
  Save,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { getBandUser } from "@/lib/bandAuth";
import toast from "react-hot-toast";

export default function ArtistSettingsPage() {
  const { user } = useAuth();
  const bandUser = getBandUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    bookingInquiries: true,
    chatMessages: true,
    verificationUpdates: true,
    payoutAlerts: true,
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully!");
    }, 600);
  };

  const handleToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success("Notification preferences saved");
  };

  return (
    <DashboardLayout role="artist">
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        
        {/* Header Title Bar */}
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "9999px", backgroundColor: "#0a0a0f", color: "#c6ff3d", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
            <Settings style={{ width: "13px", height: "13px" }} />
            <span>Account &amp; Security Preferences</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
            Artist Account Settings
          </h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0", fontWeight: 500 }}>
            Manage your login credentials, password security, and automated platform alerts.
          </p>
        </div>

        {/* Account Info Card */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#0a0a0f", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
            Account Credentials
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Registered Name</span>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#0a0a0f", margin: "2px 0 0 0" }}>{bandUser?.name || user?.name || "Performer"}</p>
            </div>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Email Address</span>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#0a0a0f", margin: "2px 0 0 0" }}>{bandUser?.email || user?.email || "artist@bandconnect.live"}</p>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <form onSubmit={handlePasswordChange} style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#0a0a0f", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
            Change Password
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f" }}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px", outline: "none" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f" }}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f" }}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px", outline: "none" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            style={{
              alignSelf: "flex-start",
              padding: "11px 24px",
              borderRadius: "12px",
              backgroundColor: "#0a0a0f",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "13px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {savingPassword ? "Updating..." : "Update Password"}
          </button>
        </form>

        {/* Notifications Toggles */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#0a0a0f", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
            Notification Channels
          </h2>

          {[
            { id: "bookingInquiries", label: "New Booking Inquiries", desc: "Notify when an event organizer requests a quote" },
            { id: "chatMessages", label: "Client Chat Messages", desc: "Notify when an event host sends a direct chat message" },
            { id: "verificationUpdates", label: "Admin Verification Outcomes", desc: "Notify on profile review approvals and requests" },
            { id: "payoutAlerts", label: "Escrow & Payout Releases", desc: "Notify when funds are cleared and deposited" },
          ].map((n) => (
            <div key={n.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
              <div>
                <h4 style={{ fontSize: "13.5px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>{n.label}</h4>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{n.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(n.id)}
                style={{
                  width: "44px",
                  height: "24px",
                  borderRadius: "9999px",
                  backgroundColor: notifications[n.id] ? "#0a0a0f" : "#e2e8f0",
                  position: "relative",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "9999px",
                    backgroundColor: notifications[n.id] ? "#c6ff3d" : "#ffffff",
                    position: "absolute",
                    top: "3px",
                    left: notifications[n.id] ? "23px" : "3px",
                    transition: "all 0.2s ease",
                  }}
                />
              </button>
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
