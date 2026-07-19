"use client";
import { API_BASE_URL, WS_BASE_URL } from "@/lib/api";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Send, CheckCircle, Clock } from "lucide-react";
import "../../../../styles/matches.css";

const API = API_BASE_URL;
const WS_API = WS_BASE_URL;

const EVENT_TYPES = [
    { value: "score_update", label: "Score (Goal / Point)" },
    { value: "foul", label: "Foul" },
    { value: "yellow_card", label: "Yellow Card" },
    { value: "red_card", label: "Red Card" },
    { value: "timeout", label: "Timeout" },
    { value: "halftime", label: "Halftime" },
    { value: "substitution", label: "Substitution" },
    { value: "general", label: "General Note" },
];

export default function DashboardMatchManagePage() {
    const params = useParams();
    const router = useRouter();
    const matchId = params?.id;

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [wsConnected, setWsConnected] = useState(false);
    const [teamAMembers, setTeamAMembers] = useState([]);
    const [teamBMembers, setTeamBMembers] = useState([]);

    // Log Custom Event Form States
    const [eventType, setEventType] = useState("general");
    const [eventDesc, setEventDesc] = useState("");
    const [eventMinute, setEventMinute] = useState("");
    const [submittingEvent, setSubmittingEvent] = useState(false);

    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);

    // Fetch match info (fallback / initial load)
    const fetchMatch = async () => {
        try {
            const r = await fetch(`${API}/matches/${matchId}`);
            if (r.ok) {
                const data = await r.json();
                setMatch(data);
            } else {
                console.error("Failed to load match details");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // WebSocket Connection logic
    const connectWS = () => {
        if (!matchId) return;

        if (wsRef.current) {
            wsRef.current.close();
        }

        const socket = new WebSocket(`${WS_API}/ws/scoreboard/${matchId}`);
        wsRef.current = socket;

        socket.onopen = () => {
            console.log("WebSocket connected to scoreboard feed");
            setWsConnected(true);
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setMatch(data);
            } catch (err) {
                console.error("Error parsing WebSocket scoreboard data:", err);
            }
        };

        socket.onclose = () => {
            console.log("WebSocket connection closed, reconnecting in 3 seconds...");
            setWsConnected(false);
            reconnectTimerRef.current = setTimeout(() => {
                connectWS();
            }, 3000);
        };

        socket.onerror = (err) => {
            console.error("WebSocket error:", err);
            socket.close();
        };
    };

    useEffect(() => {
        fetchMatch();
        connectWS();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
        };
    }, [matchId]);

    useEffect(() => {
        if (!match) return;

        const loadTeamMembers = async () => {
            const tA = match.teams[0];
            const tB = match.teams[1];
            const owner = match.owner_id;

            if (tA && tA.group_id) {
                try {
                    const r = await fetch(`${API}/groups/${tA.group_id}/members?owner_id=${owner}`);
                    if (r.ok) {
                        const data = await r.json();
                        setTeamAMembers(data || []);
                    }
                } catch (e) {
                    console.error("Error loading Team A members:", e);
                }
            }

            if (tB && tB.group_id) {
                try {
                    const r = await fetch(`${API}/groups/${tB.group_id}/members?owner_id=${owner}`);
                    if (r.ok) {
                        const data = await r.json();
                        setTeamBMembers(data || []);
                    }
                } catch (e) {
                    console.error("Error loading Team B members:", e);
                }
            }
        };

        loadTeamMembers();
    }, [match?.id]);

    // Handle Score Increment/Decrement
    const handleScoreChange = async (teamId, currentScore, delta) => {
        const newScore = Math.max(0, currentScore + delta);
        if (newScore === currentScore) return;

        const team = match.teams.find((t) => t.id === teamId);
        let scoreEventDesc = `${team.team_name} score updated to ${newScore}.`;
        let logEventType = "score_update";

        if (delta > 0) {
            if (match.sport === "Football") {
                scoreEventDesc = `GOAL! ${team.team_name} scores!`;
                logEventType = "goal";
            } else if (match.sport === "Basketball") {
                scoreEventDesc = `Point scored by ${team.team_name}`;
                logEventType = "point";
            }
        }

        try {
            const r = await fetch(`${API}/matches/${matchId}/score`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    team_id: teamId,
                    new_score: newScore,
                    event_type: logEventType,
                    description: scoreEventDesc,
                    minute: eventMinute ? Number(eventMinute) : null,
                }),
            });

            if (!r.ok) {
                toast.error("Failed to update score.");
            } else {
                toast.success("Score updated! ⚽");
            }
        } catch (err) {
            console.error("Error updating score:", err);
            toast.error("Error communicating with server.");
        }
    };

    // Log Custom Event (substitution, foul, card, etc.)
    const handleLogEvent = async (e) => {
        e.preventDefault();
        if (!eventDesc.trim()) return;

        setSubmittingEvent(true);
        try {
            const r = await fetch(`${API}/matches/${matchId}/events`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_type: eventType,
                    description: eventDesc.trim(),
                    minute: eventMinute ? Number(eventMinute) : null,
                    team_id: null,
                }),
            });

            if (r.ok) {
                setEventDesc("");
                setEventMinute("");
                toast.success("Match event logged successfully! 📢");
            } else {
                toast.error("Failed to log event.");
            }
        } catch (err) {
            console.error("Error logging event:", err);
            toast.error("Error connecting to server.");
        } finally {
            setSubmittingEvent(false);
        }
    };

    const handleFinishMatch = async () => {
        if (
            !confirm(
                "Are you sure you want to finish this match? This action will set the match status to Completed and declare the winner based on current scores."
            )
        )
            return;

        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

        try {
            const r = await fetch(`${API}/matches/${matchId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ status: "completed" }),
            });

            if (r.ok) {
                toast.success("Match finished successfully! 🏁");
                router.push("/dashboard/matches");
            } else {
                toast.error("Failed to finish match.");
            }
        } catch (err) {
            console.error("Error finishing match:", err);
            toast.error("Error connecting to server.");
        }
    };

    if (loading) {
        return (
            <div className="vd-loading">
                <div className="vd-spinner" /> Loading scorekeeper dashboard…
            </div>
        );
    }

    if (!match) {
        return (
            <div className="vd-card" style={{ padding: 48, textAlign: "center" }}>
                <div style={{ color: "#ff3b30", fontSize: "36px", marginBottom: "16px" }}>⚠️</div>
                <h2 style={{ color: "#fff" }}>Match Not Found</h2>
                <p style={{ color: "var(--vd-muted)", marginTop: "8px" }}>
                    The match you are trying to manage does not exist or has been deleted.
                </p>
                <Link
                    href="/dashboard/matches"
                    className="m-btn secondary"
                    style={{ display: "inline-flex", marginTop: "24px", width: "200px", textDecoration: "none" }}
                >
                    Back to Matches
                </Link>
            </div>
        );
    }

    const teamA = match.teams[0];
    const teamB = match.teams[1];

    return (
        <div style={{ padding: "20px" }}>
            {/* Header section */}
            <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Link
                        href="/dashboard/matches"
                        style={{ color: "var(--vd-muted)", display: "flex", alignItems: "center" }}
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1
                            className="vd-page-title"
                            style={{ color: "#fff", fontSize: "28px", fontWeight: "800", margin: 0 }}
                        >
                            Scorekeeper Panel
                        </h1>
                        <p className="vd-page-sub" style={{ color: "var(--vd-muted)" }}>
                            Updating live feed for: <strong style={{ color: "#fff" }}>{match.title}</strong>
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: wsConnected ? "var(--vd-brand)" : "#ff3b30",
                            background: wsConnected ? "rgba(191, 254, 0, 0.06)" : "rgba(255, 59, 48, 0.06)",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: `1px solid ${wsConnected ? "rgba(191, 254, 0, 0.2)" : "rgba(255, 59, 48, 0.2)"}`,
                        }}
                    >
                        <RefreshCw size={12} className={wsConnected ? "" : "animate-spin"} />
                        {wsConnected ? "Live Connection Active" : "Disconnected, Reconnecting..."}
                    </span>

                    <button
                        onClick={handleFinishMatch}
                        className="m-btn primary"
                        style={{ background: "#ff3b30", color: "#fff" }}
                    >
                        <CheckCircle size={14} />
                        Finish Match
                    </button>
                </div>
            </div>

            {/* Scorekeeper Layout */}
            <div className="op-layout">
                {/* Left Column: Scores & Logs */}
                <div>
                    {/* Score Control Card */}
                    <div className="op-scoreboard-card">
                        <div className="op-match-title">
                            {match.sport} · {match.match_type.replace("_", "-").toUpperCase()}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--vd-muted)", margin: "4px 0" }}>
                            {match.venue || "No venue assigned"}
                        </div>

                        <div className="op-teams-grid">
                            {/* Team A */}
                            <div className="op-team-col">
                                <div className="op-team-name">{teamA?.team_name}</div>
                                <div
                                    className="op-score-box"
                                    style={{
                                        borderColor: teamA?.color || "var(--vd-brand)",
                                        textShadow: `0 0 10px ${teamA?.color || "var(--vd-brand)"}33`,
                                    }}
                                >
                                    {teamA?.score}
                                </div>
                                <div
                                    className="op-score-row"
                                    style={{ display: "flex", gap: "8px", marginTop: "16px" }}
                                >
                                    <button
                                        onClick={() => handleScoreChange(teamA.id, teamA.score, -1)}
                                        className="op-score-btn minus"
                                    >
                                        -1
                                    </button>
                                    <button
                                        onClick={() => handleScoreChange(teamA.id, teamA.score, 1)}
                                        className="op-score-btn plus"
                                    >
                                        +1
                                    </button>
                                </div>
                            </div>

                            <div className="op-vs-divider">VS</div>

                            {/* Team B */}
                            <div className="op-team-col">
                                <div className="op-team-name">{teamB?.team_name}</div>
                                <div
                                    className="op-score-box"
                                    style={{
                                        borderColor: teamB?.color || "var(--vd-cyan)",
                                        textShadow: `0 0 10px ${teamB?.color || "var(--vd-cyan)"}33`,
                                    }}
                                >
                                    {teamB?.score}
                                </div>
                                <div
                                    className="op-score-row"
                                    style={{ display: "flex", gap: "8px", marginTop: "16px" }}
                                >
                                    <button
                                        onClick={() => handleScoreChange(teamB.id, teamB.score, -1)}
                                        className="op-score-btn minus"
                                    >
                                        -1
                                    </button>
                                    <button
                                        onClick={() => handleScoreChange(teamB.id, teamB.score, 1)}
                                        className="op-score-btn plus"
                                        style={{ backgroundColor: "var(--vd-cyan)" }}
                                    >
                                        +1
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Event Logger Form */}
                    <div className="op-log-form">
                        <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#fff", marginBottom: "16px" }}>
                            Log Match Event
                        </h2>

                        <form onSubmit={handleLogEvent}>
                            <div className="m-grid-2">
                                <div className="m-input-group">
                                    <label className="m-label">Event Type</label>
                                    <select
                                        className="m-select"
                                        value={eventType}
                                        onChange={(e) => setEventType(e.target.value)}
                                    >
                                        {EVENT_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="m-input-group">
                                    <label className="m-label">Match Minute (Optional)</label>
                                    <input
                                        type="number"
                                        className="m-input"
                                        placeholder="e.g. 45"
                                        min="0"
                                        max="180"
                                        value={eventMinute}
                                        onChange={(e) => setEventMinute(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="m-input-group">
                                <label className="m-label">Event Description *</label>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <input
                                        type="text"
                                        className="m-input"
                                        placeholder="e.g. Yellow card for jersey #7, Corner kick, Halftime whistle"
                                        style={{ flexGrow: 1 }}
                                        value={eventDesc}
                                        onChange={(e) => setEventDesc(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={submittingEvent || !eventDesc.trim()}
                                        className="m-btn primary"
                                        style={{
                                            flex: "0 0 auto",
                                            width: "120px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Send size={14} />
                                        Log
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Timeline Log Feed */}
                <div className="timeline-card">
                    <div className="timeline-header">
                        <span>Match Timeline</span>
                        <Clock size={16} style={{ color: "var(--vd-muted)" }} />
                    </div>

                    <div className="timeline-list">
                        {match.events && match.events.length > 0 ? (
                            match.events.map((evt, idx) => (
                                <div key={evt.id || idx} className="timeline-item">
                                    <span className="timeline-time">
                                        {evt.minute !== null && evt.minute !== undefined ? `${evt.minute}'` : "Live"}
                                    </span>
                                    <div className="timeline-info">
                                        <div className="timeline-title">
                                            {evt.event_type.replace("_", " ").toUpperCase()}
                                        </div>
                                        <div className="timeline-desc">{evt.description}</div>
                                    </div>
                                    {evt.score_at_event && <span className="timeline-score">{evt.score_at_event}</span>}
                                </div>
                            ))
                        ) : (
                            <div
                                style={{
                                    color: "var(--vd-muted)",
                                    fontSize: "13px",
                                    textAlign: "center",
                                    padding: "40px 0",
                                }}
                            >
                                No events logged yet. Match updates will appear here in chronological order.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Team Squads Panel */}
            {(teamAMembers.length > 0 || teamBMembers.length > 0) && (
                <div className="vd-card" style={{ marginTop: "24px", padding: "24px", background: "var(--vd-surface)", border: "1px solid var(--vd-border)", borderRadius: "20px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#fff", marginBottom: "20px", letterSpacing: "0.5px" }}>
                        Group-Specific Team Members & Lineups
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                        {/* Team A Roster */}
                        <div>
                            <h3 style={{ fontSize: "14px", fontWeight: "700", color: teamA.color || "var(--vd-brand)", borderBottom: "1px solid var(--vd-border)", paddingBottom: "8px", marginBottom: "12px" }}>
                                {teamA?.team_name} Squad
                            </h3>
                            {teamAMembers.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {teamAMembers.map((m) => (
                                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255, 255, 255, 0.02)", padding: "8px 12px", borderRadius: "8px" }}>
                                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: teamA.color || "var(--vd-brand)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800" }}>
                                                {m.first_name[0].toUpperCase()}
                                            </div>
                                            <span style={{ fontSize: "13px", fontWeight: "500", color: "#e2e8f0" }}>{m.first_name} {m.last_name || ""}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span style={{ fontSize: "12px", color: "var(--vd-muted)" }}>No players registered in this team.</span>
                            )}
                        </div>

                        {/* Team B Roster */}
                        <div>
                            <h3 style={{ fontSize: "14px", fontWeight: "700", color: teamB.color || "var(--vd-cyan)", borderBottom: "1px solid var(--vd-border)", paddingBottom: "8px", marginBottom: "12px" }}>
                                {teamB?.team_name} Squad
                            </h3>
                            {teamBMembers.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {teamBMembers.map((m) => (
                                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255, 255, 255, 0.02)", padding: "8px 12px", borderRadius: "8px" }}>
                                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: teamB.color || "var(--vd-cyan)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800" }}>
                                                {m.first_name[0].toUpperCase()}
                                            </div>
                                            <span style={{ fontSize: "13px", fontWeight: "500", color: "#e2e8f0" }}>{m.first_name} {m.last_name || ""}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span style={{ fontSize: "12px", color: "var(--vd-muted)" }}>
                                    {teamB?.club_name ? "Squad list unavailable (Guest Team)" : "No players registered in this team."}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
