"use client";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import "../../../styles/matches.css";

const API = API_BASE_URL;
const SPORTS_LIST = ["Football", "Cricket", "Basketball", "Tennis", "Badminton", "Volleyball", "Kabaddi", "Squash"];

export default function MatchCreatePage() {
    const router = useRouter();
    const [groups, setGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(true);

    const ownerId = typeof window !== "undefined" ? localStorage.getItem("venueOwnerId") : null;

    // Form states
    const [title, setTitle] = useState("");
    const [sport, setSport] = useState("Football");
    const [matchType, setMatchType] = useState("intra_club"); // intra_club | inter_club
    const [venue, setVenue] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");

    // Team states
    const [teamASelectedGroup, setTeamASelectedGroup] = useState("");
    const [teamAName, setTeamAName] = useState("");
    const [teamAColor, setTeamAColor] = useState("#bffe00");

    const [teamBSelectedGroup, setTeamBSelectedGroup] = useState("");
    const [teamBName, setTeamBName] = useState("");
    const [teamBClub, setTeamBClub] = useState("");
    const [teamBColor, setTeamBColor] = useState("#00f0ff");

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadGroups = async () => {
            if (!ownerId) return;
            try {
                const r = await fetch(`${API}/groups?owner_id=${ownerId}`);
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

    // Handle Team A group selection change
    const handleTeamAGroupChange = (groupId) => {
        setTeamASelectedGroup(groupId);
        if (groupId) {
            const grp = groups.find((g) => g.id === Number(groupId));
            if (grp) setTeamAName(grp.group_name);
        } else {
            setTeamAName("");
        }
    };

    // Handle Team B group selection change (Intra-Club only)
    const handleTeamBGroupChange = (groupId) => {
        setTeamBSelectedGroup(groupId);
        if (groupId) {
            const grp = groups.find((g) => g.id === Number(groupId));
            if (grp) {
                setTeamBName(grp.group_name);
                setTeamBClub("");
            }
        } else {
            setTeamBName("");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Validation
        const finalTeamAName = teamAName.trim();
        const finalTeamBName = teamBName.trim();

        if (!title.trim()) return alert("Please enter a match title.");
        if (!finalTeamAName) return alert("Please specify Team A.");
        if (!finalTeamBName) return alert("Please specify Team B.");
        if (matchType === "intra_club" && teamASelectedGroup && teamASelectedGroup === teamBSelectedGroup) {
            return alert("Team A and Team B cannot be the same group.");
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
                    color: teamAColor,
                },
                {
                    team_name: finalTeamBName,
                    group_id: matchType === "intra_club" && teamBSelectedGroup ? Number(teamBSelectedGroup) : null,
                    club_name: matchType === "inter_club" ? teamBClub.trim() || "Guest Club" : null,
                    color: teamBColor,
                },
            ],
        };

        try {
            const r = await fetch(`${API}/matches`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
        <>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <Link
                    href="/venue-dashboard/matches"
                    style={{ color: "var(--vd-muted)", display: "flex", alignItems: "center" }}
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="vd-page-title" style={{ margin: 0 }}>
                        Create Match
                    </h1>
                    <p className="vd-page-sub">Schedule and setup teams for a new match</p>
                </div>
            </div>

            <div className="m-form-container">
                <form onSubmit={handleSave}>
                    {/* SECTION 1: MATCH METADATA */}
                    <div className="m-form-section">
                        <div className="m-section-title">1. Match Details</div>
                        <div className="m-input-group">
                            <label className="m-label">Match Title *</label>
                            <input
                                type="text"
                                className="m-input"
                                placeholder="e.g. Club Championship Finals, Friendly Warmup"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="m-grid-2">
                            <div className="m-input-group">
                                <label className="m-label">Sport *</label>
                                <select className="m-select" value={sport} onChange={(e) => setSport(e.target.value)}>
                                    {SPORTS_LIST.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="m-input-group">
                                <label className="m-label">Match Type *</label>
                                <select
                                    className="m-select"
                                    value={matchType}
                                    onChange={(e) => {
                                        setMatchType(e.target.value);
                                        // Reset team B fields
                                        setTeamBSelectedGroup("");
                                        setTeamBName("");
                                        setTeamBClub("");
                                    }}
                                >
                                    <option value="intra_club">Intra-Club (Between Club Groups)</option>
                                    <option value="inter_club">Inter-Club (Against Outside Club)</option>
                                </select>
                            </div>
                        </div>

                        <div className="m-grid-2">
                            <div className="m-input-group">
                                <label className="m-label">Venue / Court Location</label>
                                <input
                                    type="text"
                                    className="m-input"
                                    placeholder="e.g. Ground A, Pitch 2"
                                    value={venue}
                                    onChange={(e) => setVenue(e.target.value)}
                                />
                            </div>

                            <div className="m-input-group">
                                <label className="m-label">Scheduled Date & Time</label>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <input
                                        type="date"
                                        className="m-input"
                                        style={{ flex: 1 }}
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                    />
                                    <input
                                        type="time"
                                        className="m-input"
                                        style={{ flex: 1 }}
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: TEAM SETUP */}
                    <div className="m-form-section">
                        <div className="m-section-title">2. Team Configuration</div>

                        <div className="m-grid-2">
                            {/* TEAM A (Home Team/Group) */}
                            <div
                                style={{
                                    background: "rgba(255,255,255,0.01)",
                                    border: "1px solid var(--vd-border)",
                                    borderRadius: "12px",
                                    padding: "16px",
                                }}
                            >
                                <h3
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: "700",
                                        color: "#fff",
                                        marginBottom: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "inline-block",
                                            width: "10px",
                                            height: "10px",
                                            borderRadius: "50%",
                                            backgroundColor: teamAColor,
                                        }}
                                    />
                                    Team A (Home)
                                </h3>

                                <div className="m-input-group">
                                    <label className="m-label">Select Club Group/Team</label>
                                    <select
                                        className="m-select"
                                        value={teamASelectedGroup}
                                        onChange={(e) => handleTeamAGroupChange(e.target.value)}
                                    >
                                        <option value="">-- Select Existing Group --</option>
                                        {groups.map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.group_name} ({g.activity})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="m-input-group">
                                    <label className="m-label">Team Display Name *</label>
                                    <input
                                        type="text"
                                        className="m-input m-input-team"
                                        placeholder="Enter display name"
                                        value={teamAName}
                                        onChange={(e) => setTeamAName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="m-input-group">
                                    <label className="m-label">Jersey / Team Color</label>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <input
                                            type="color"
                                            value={teamAColor}
                                            onChange={(e) => setTeamAColor(e.target.value)}
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                padding: 0,
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: "12px",
                                                color: "var(--vd-muted)",
                                                fontFamily: "monospace",
                                            }}
                                        >
                                            {teamAColor.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* TEAM B (Opponent Team/Group) */}
                            <div
                                style={{
                                    background: "rgba(255,255,255,0.01)",
                                    border: "1px solid var(--vd-border)",
                                    borderRadius: "12px",
                                    padding: "16px",
                                }}
                            >
                                <h3
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: "700",
                                        color: "#fff",
                                        marginBottom: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "inline-block",
                                            width: "10px",
                                            height: "10px",
                                            borderRadius: "50%",
                                            backgroundColor: teamBColor,
                                        }}
                                    />
                                    Team B (Opponent)
                                </h3>

                                {matchType === "intra_club" ? (
                                    <>
                                        <div className="m-input-group">
                                            <label className="m-label">Select Club Group/Team</label>
                                            <select
                                                className="m-select"
                                                value={teamBSelectedGroup}
                                                onChange={(e) => handleTeamBGroupChange(e.target.value)}
                                            >
                                                <option value="">-- Select Existing Group --</option>
                                                {groups.map((g) => (
                                                    <option key={g.id} value={g.id}>
                                                        {g.group_name} ({g.activity})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="m-input-group">
                                            <label className="m-label">Team Display Name *</label>
                                            <input
                                                type="text"
                                                className="m-input m-input-team-b"
                                                placeholder="Enter display name"
                                                value={teamBName}
                                                onChange={(e) => setTeamBName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="m-input-group">
                                            <label className="m-label">Opponent Club Name</label>
                                            <input
                                                type="text"
                                                className="m-input"
                                                placeholder="e.g. City Lions Club"
                                                value={teamBClub}
                                                onChange={(e) => setTeamBClub(e.target.value)}
                                            />
                                        </div>

                                        <div className="m-input-group">
                                            <label className="m-label">Team Display Name *</label>
                                            <input
                                                type="text"
                                                className="m-input m-input-team-b"
                                                placeholder="e.g. Lions FC, Under 19s"
                                                value={teamBName}
                                                onChange={(e) => setTeamBName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="m-input-group">
                                    <label className="m-label">Jersey / Team Color</label>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <input
                                            type="color"
                                            value={teamBColor}
                                            onChange={(e) => setTeamBColor(e.target.value)}
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                padding: 0,
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: "12px",
                                                color: "var(--vd-muted)",
                                                fontFamily: "monospace",
                                            }}
                                        >
                                            {teamBColor.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SAVE BUTTON */}
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                        <Link
                            href="/venue-dashboard/matches"
                            className="m-btn secondary"
                            style={{ flex: "0 0 auto", width: "120px", textDecoration: "none" }}
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="m-btn primary"
                            style={{
                                flex: "0 0 auto",
                                width: "180px",
                                padding: "12px 24px",
                                height: "auto",
                                fontSize: "14px",
                                fontWeight: "800",
                                backgroundColor: "#10b981",
                                color: "#fff",
                                border: "none",
                                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                            }}
                        >
                            <Save size={16} />
                            {saving ? "Creating..." : "Save Match"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
