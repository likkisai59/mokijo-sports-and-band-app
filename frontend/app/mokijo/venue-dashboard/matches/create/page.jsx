"use client";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import "@/app/styles/matches.css";

const API = API_BASE_URL;
const SPORTS_LIST = ["Football", "Cricket", "Basketball", "Tennis", "Badminton", "Volleyball", "Kabaddi", "Squash"];
const DEFAULT_TEAM_A_COLOR = "#c6ff3d";
const DEFAULT_TEAM_B_COLOR = "#d9ff6e";

function memberDisplayName(m) {
    const name = `${m.first_name || ""} ${m.last_name || ""}`.trim();
    return name || m.email || "Member";
}

export default function MatchCreatePage() {
    const router = useRouter();
    const [groups, setGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(true);

    const ownerId = typeof window !== "undefined" ? localStorage.getItem("venueOwnerId") : null;

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
            setSameTeamError("Team A and Team B should not be same");
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
            setSameTeamError("Team A and Team B should not be same");
            setTeamBSelectedGroup("");
            setTeamBName("");
            setTeamBMembers([]);
            return;
        }
        setSameTeamError("");
        setTeamBSelectedGroup(groupId);
        if (groupId) {
            const grp = groups.find((g) => g.id === Number(groupId));
            if (grp) {
                setTeamBName(grp.group_name);
                setTeamBClub("");
            }
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

        const finalTeamAName = teamAName.trim();
        const finalTeamBName =
            matchType === "inter_club"
                ? (teamBName.trim() || teamBClub.trim() || "Guest Club")
                : teamBName.trim();

        if (!title.trim()) return alert("Please enter a match title.");
        if (matchType === "intra_club" && !teamASelectedGroup) return alert("Please select Team A group.");
        if (matchType === "intra_club" && !teamBSelectedGroup) return alert("Please select Team B group.");
        if (!finalTeamAName) return alert("Please specify Team A.");
        if (matchType === "inter_club" && !teamBClub.trim()) return alert("Please enter opponent club name.");
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

    const renderMemberPreview = (members, loading) => (
        <div className="m-input-group">
            <label className="m-label">Selected Team</label>
            {loading ? (
                <p style={{ fontSize: "13px", color: "var(--vd-muted)", margin: 0 }}>Loading members...</p>
            ) : members.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--vd-muted)", margin: 0 }}>No members in this group</p>
            ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {members.map((m, idx) => (
                        <span
                            key={m.id || idx}
                            style={{
                                fontSize: "12px",
                                padding: "4px 10px",
                                borderRadius: "999px",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid var(--vd-border)",
                                color: "#e2e8f0",
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
                                        <option key={s} value={s} style={{ backgroundColor: "#181920", color: "#ffffff" }}>
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
                                        setTeamBSelectedGroup("");
                                        setTeamBName("");
                                        setTeamBClub("");
                                        setTeamBMembers([]);
                                    }}
                                >
                                    <option value="intra_club" style={{ backgroundColor: "#181920", color: "#ffffff" }}>Intra-Club (Between Club Groups)</option>
                                    <option value="inter_club" style={{ backgroundColor: "#181920", color: "#ffffff" }}>Inter-Club (Against Outside Club)</option>
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

                    <div className="m-form-section">
                        <div className="m-section-title">2. Team Configuration</div>

                        <div className="m-grid-2">
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
                                    }}
                                >
                                    Team A (Home)
                                </h3>

                                <div className="m-input-group">
                                    <label className="m-label">Select Club Group/Team</label>
                                    <select
                                        className="m-select"
                                        value={teamASelectedGroup}
                                        onChange={(e) => handleTeamAGroupChange(e.target.value)}
                                    >
                                        <option value="" style={{ backgroundColor: "#181920", color: "#ffffff" }}>-- Select Existing Group --</option>
                                        {groups.map((g) => {
                                            const isSelectedInTeamB = String(g.id) === String(teamBSelectedGroup);
                                            return (
                                                <option
                                                    key={g.id}
                                                    value={g.id}
                                                    disabled={isSelectedInTeamB}
                                                    style={{
                                                        backgroundColor: "#181920",
                                                        color: isSelectedInTeamB ? "#64748b" : "#ffffff",
                                                    }}
                                                >
                                                    {g.group_name} ({g.activity}) {isSelectedInTeamB ? "— (Already Team B)" : ""}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {teamASelectedGroup && renderMemberPreview(teamAMembers, loadingTeamAMembers)}
                            </div>

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
                                    }}
                                >
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
                                                <option value="" style={{ backgroundColor: "#181920", color: "#ffffff" }}>-- Select Existing Group --</option>
                                                {groups.map((g) => {
                                                    const isSelectedInTeamA = String(g.id) === String(teamASelectedGroup);
                                                    return (
                                                        <option
                                                            key={g.id}
                                                            value={g.id}
                                                            disabled={isSelectedInTeamA}
                                                            style={{
                                                                backgroundColor: "#181920",
                                                                color: isSelectedInTeamA ? "#64748b" : "#ffffff",
                                                            }}
                                                        >
                                                            {g.group_name} ({g.activity}) {isSelectedInTeamA ? "— (Already Team A)" : ""}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                        {teamBSelectedGroup && renderMemberPreview(teamBMembers, loadingTeamBMembers)}
                                    </>
                                ) : (
                                    <div className="m-input-group">
                                        <label className="m-label">Opponent Club Name *</label>
                                        <input
                                            type="text"
                                            className="m-input"
                                            placeholder="e.g. Thunderbolts SC, City Strikers"
                                            value={teamBClub}
                                            onChange={(e) => setTeamBClub(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {sameTeamError && (
                            <p
                                style={{
                                    color: "#ef4444",
                                    fontSize: "13px",
                                    marginTop: "12px",
                                    marginBottom: 0,
                                    fontWeight: 600,
                                }}
                            >
                                ⚠️ {sameTeamError}
                            </p>
                        )}
                    </div>

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
                            disabled={
                                saving ||
                                loadingGroups ||
                                (matchType === "intra_club" &&
                                    teamASelectedGroup &&
                                    teamBSelectedGroup &&
                                    String(teamASelectedGroup) === String(teamBSelectedGroup))
                            }
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
