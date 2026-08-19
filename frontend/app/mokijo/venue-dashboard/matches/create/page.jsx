"use client";

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trophy,
  Users,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API = API_BASE_URL;
const SPORTS_LIST = [
  "Football",
  "Cricket",
  "Basketball",
  "Tennis",
  "Badminton",
  "Volleyball",
  "Kabaddi",
  "Squash",
];
const DEFAULT_TEAM_A_COLOR = "#10b981";
const DEFAULT_TEAM_B_COLOR = "#3b82f6";

export default function VenueDashboardMatchCreatePage() {
  const router = useRouter();
  const [courts, setCourts] = useState([]);
  const [loadingCourts, setLoadingCourts] = useState(true);

  const ownerId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("Football");
  const [venueCourt, setVenueCourt] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a match title");
      return;
    }

    setSaving(true);

    const body = {
      owner_id: Number(ownerId),
      title: title.trim(),
      sport,
      match_type: "venue_booking_match",
      venue: venueCourt.trim() || null,
      scheduled_at: (() => {
        if (scheduledDate && scheduledTime) {
          return new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
        } else if (scheduledDate) {
          return new Date(`${scheduledDate}T00:00`).toISOString();
        }
        return null;
      })(),
      teams: [
        {
          team_name: teamAName.trim() || "Team Alpha",
          color: DEFAULT_TEAM_A_COLOR,
        },
        {
          team_name: teamBName.trim() || "Team Beta",
          color: DEFAULT_TEAM_B_COLOR,
        },
      ],
    };

    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const r = await fetch(`${API}/matches`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (r.ok) {
        router.push("/venue-dashboard/matches");
      } else {
        const errData = await r.json().catch(() => ({}));
        alert(errData.detail || "Failed to create match");
      }
    } catch (err) {
      console.error("Error creating match:", err);
      alert("Connection error. Failed to create match.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "16px 20px 60px", width: "100%", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
        <Link
          href="/venue-dashboard/matches"
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "14px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0f172a",
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
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
              marginBottom: "6px",
            }}
          >
            <Trophy size={12} />
            <span>Venue Scoreboard Suite</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>
            Host Venue Match
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: 500 }}>
            Schedule and configure digital court fixtures for customer bookings.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid rgba(10, 10, 15, 0.08)",
            padding: "28px 32px",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                backgroundColor: "#0a0a0f",
                color: "#c6ff3d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 900,
              }}
            >
              1
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Fixture Information & Court Setup
            </h3>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Match Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Saturday League Stage 1, Badminton Finals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                fontWeight: 700,
                color: "#0f172a",
                backgroundColor: "#f8fafc",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                Sport Discipline *
              </label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#0f172a",
                  backgroundColor: "#f8fafc",
                  cursor: "pointer",
                }}
              >
                {SPORTS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                Court / Pitch Designation
              </label>
              <input
                type="text"
                placeholder="e.g. Badminton Court 1, Turf B"
                value={venueCourt}
                onChange={(e) => setVenueCourt(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0f172a",
                  backgroundColor: "#f8fafc",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Scheduled Date & Time
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                style={{
                  flex: 1,
                  padding: "14px 14px",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0f172a",
                  backgroundColor: "#f8fafc",
                  boxSizing: "border-box",
                }}
              />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                style={{
                  flex: 1,
                  padding: "14px 14px",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0f172a",
                  backgroundColor: "#f8fafc",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── CARD 2: TEAM SETUP ── */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid rgba(10, 10, 15, 0.08)",
            padding: "28px 32px",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                backgroundColor: "#0a0a0f",
                color: "#c6ff3d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 900,
              }}
            >
              2
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Team & Participant Identification
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#10b981",
                    display: "inline-block",
                  }}
                />
                <h4 style={{ fontSize: "14px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  Team 1 / Player 1
                </h4>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Name / Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Smashers XI, John Doe"
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#0f172a",
                    backgroundColor: "#ffffff",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#3b82f6",
                    display: "inline-block",
                  }}
                />
                <h4 style={{ fontSize: "14px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  Team 2 / Player 2
                </h4>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Name / Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aces, Jane Smith"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#0f172a",
                    backgroundColor: "#ffffff",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <Link
            href="/venue-dashboard/matches"
            style={{
              padding: "14px 24px",
              borderRadius: "14px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              fontWeight: 800,
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 32px",
              borderRadius: "14px",
              backgroundColor: "#0a0a0f",
              color: "#c6ff3d",
              fontWeight: 800,
              fontSize: "14px",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Save size={16} />
            <span>{saving ? "Scheduling Match..." : "Create & Launch Match"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
