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

function memberDisplayName(m) {
  const name = `${m.first_name || ""} ${m.last_name || ""}`.trim();
  return name || m.email || "Member";
}

export default function DashboardMatchCreatePage() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const ownerId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("Football");
  const [matchType, setMatchType] = useState("intra_club");
  const [venue, setVenue] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const [teamASelectedGroup, setTeamASelectedGroup] = useState("");
  const [teamAName, setTeamAName] = useState("");
  const [teamAMembers, setTeamAMembers] = useState([]);
  const [loadingTeamAMembers, setLoadingTeamAMembers] = useState(false);

  const [teamBSelectedGroup, setTeamBSelectedGroup] = useState("");
  const [teamBName, setTeamBName] = useState("");
  const [teamBClub, setTeamBClub] = useState("");
  const [teamBMembers, setTeamBMembers] = useState([]);
  const [loadingTeamBMembers, setLoadingTeamBMembers] = useState(false);

  const [sameTeamError, setSameTeamError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      if (!ownerId) return;
      try {
        const token = localStorage.getItem("accessToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const r = await fetch(`${API}/groups?owner_id=${ownerId}`, { headers });
        if (r.ok) {
          const data = await r.json();
          setGroups(data || []);
        }
      } catch (err) {
        console.error("Error loading groups:", err);
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, [ownerId]);

  const fetchGroupMembers = async (groupId) => {
    if (!ownerId || !groupId) return [];
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const r = await fetch(`${API}/groups/${groupId}/members?owner_id=${ownerId}`, { headers });
      if (r.ok) {
        return (await r.json()) || [];
      }
    } catch (err) {
      console.error("Error loading group members:", err);
    }
    return [];
  };

  const handleTeamAGroupChange = async (groupId) => {
    if (groupId && String(groupId) === String(teamBSelectedGroup)) {
      setSameTeamError("Team A and Team B cannot be the same club group.");
      setTeamASelectedGroup("");
      setTeamAName("");
      setTeamAMembers([]);
      return;
    }
    setSameTeamError("");
    setTeamASelectedGroup(groupId);
    if (groupId) {
      const grp = groups.find((g) => g.id === Number(groupId));
      if (grp) setTeamAName(grp.group_name);
      setLoadingTeamAMembers(true);
      const members = await fetchGroupMembers(groupId);
      setTeamAMembers(members);
      setLoadingTeamAMembers(false);
    } else {
      setTeamAName("");
      setTeamAMembers([]);
    }
  };

  const handleTeamBGroupChange = async (groupId) => {
    if (groupId && String(groupId) === String(teamASelectedGroup)) {
      setSameTeamError("Team A and Team B cannot be the same club group.");
      setTeamBSelectedGroup("");
      setTeamBName("");
      setTeamBMembers([]);
      return;
    }
    setSameTeamError("");
    setTeamBSelectedGroup(groupId);
    if (groupId) {
      const grp = groups.find((g) => g.id === Number(groupId));
      if (grp) setTeamBName(grp.group_name);
      setLoadingTeamBMembers(true);
      const members = await fetchGroupMembers(groupId);
      setTeamBMembers(members);
      setLoadingTeamBMembers(false);
    } else {
      setTeamBName("");
      setTeamBMembers([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a match title");
      return;
    }

    const finalTeamAName = teamAName.trim() || "Team A";
    let finalTeamBName = teamBName.trim() || "Team B";

    if (matchType === "intra_club" && teamASelectedGroup && teamBSelectedGroup) {
      if (String(teamASelectedGroup) === String(teamBSelectedGroup)) {
        setSameTeamError("Team A and Team B cannot be the same club group.");
        return;
      }
    }

    setSaving(true);

    const body = {
      owner_id: Number(ownerId),
      title: title.trim(),
      sport,
      match_type: matchType,
      venue: venue.trim() || null,
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
          team_name: finalTeamAName,
          group_id: matchType === "intra_club" && teamASelectedGroup ? Number(teamASelectedGroup) : null,
          club_name: null,
          color: DEFAULT_TEAM_A_COLOR,
        },
        {
          team_name: finalTeamBName,
          group_id: matchType === "intra_club" && teamBSelectedGroup ? Number(teamBSelectedGroup) : null,
          club_name: matchType === "inter_club" ? teamBClub.trim() || "Guest Club" : null,
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
        router.push("/dashboard/matches");
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

  const renderMemberPreview = (members, loading) => (
    <div style={{ marginTop: "12px" }}>
      <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
        Selected Squad Roster
      </span>
      {loading ? (
        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Loading members...</p>
      ) : members.length === 0 ? (
        <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, fontStyle: "italic" }}>
          No members found in this group.
        </p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {members.map((m, idx) => (
            <span
              key={m.id || idx}
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "9999px",
                backgroundColor: "#f1f5f9",
                border: "1px solid #e2e8f0",
                color: "#0f172a",
              }}
            >
              {memberDisplayName(m)}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "16px 20px 60px", width: "100%", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* ── TOP NAV BAR & TITLE ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
        <Link
          href="/dashboard/matches"
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
            transition: "all 0.15s ease",
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
            <span>Match Management Suite</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>
            Create New Match
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: 500 }}>
            Schedule and configure teams for live digital scoreboard tracking.
          </p>
        </div>
      </div>

      {sameTeamError && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "14px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "24px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          <AlertCircle size={18} />
          <span>{sameTeamError}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* ── CARD 1: MATCH DETAILS ── */}
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
              Match Information & Schedule
            </h3>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Match Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Club Championship Finals 2026, Weekend Derby"
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
                Match Type *
              </label>
              <select
                value={matchType}
                onChange={(e) => {
                  setMatchType(e.target.value);
                  setTeamBSelectedGroup("");
                  setTeamBName("");
                  setTeamBClub("");
                  setTeamBMembers([]);
                }}
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
                <option value="intra_club">Intra-Club (Between Internal Groups)</option>
                <option value="inter_club">Inter-Club (Against External Rival Club)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                Venue / Court Location
              </label>
              <input
                type="text"
                placeholder="e.g. Ground A, Pitch 2, Main Turf"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
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
        </div>

        {/* ── CARD 2: TEAM CONFIGURATION ── */}
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
              Team & Competitor Setup
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Team A (Home) */}
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
                  Team A (Home Squad)
                </h4>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Select Club Group / Team
                </label>
                <select
                  value={teamASelectedGroup}
                  onChange={(e) => handleTeamAGroupChange(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#0f172a",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <option value="">-- Select Existing Group --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.group_name} ({g.sport || "Sport"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Custom Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Red Dragons"
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

              {teamASelectedGroup && renderMemberPreview(teamAMembers, loadingTeamAMembers)}
            </div>

            {/* Team B (Opponent) */}
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
                  Team B ({matchType === "intra_club" ? "Intra-Club Opponent" : "External Rival"})
                </h4>
              </div>

              {matchType === "intra_club" ? (
                <>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                      Select Club Group / Team
                    </label>
                    <select
                      value={teamBSelectedGroup}
                      onChange={(e) => handleTeamBGroupChange(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#0f172a",
                        backgroundColor: "#ffffff",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">-- Select Existing Group --</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.group_name} ({g.sport || "Sport"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                      Custom Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Blue Strikers"
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

                  {teamBSelectedGroup && renderMemberPreview(teamBMembers, loadingTeamBMembers)}
                </>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                      External Club Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hyderabad City FC"
                      value={teamBClub}
                      onChange={(e) => setTeamBClub(e.target.value)}
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

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                      Opponent Team Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Warriors XI"
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── SUBMIT BUTTON ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <Link
            href="/dashboard/matches"
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
