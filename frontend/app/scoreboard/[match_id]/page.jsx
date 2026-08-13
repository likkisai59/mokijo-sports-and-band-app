"use client";
import { API_BASE_URL, WS_BASE_URL } from "@/lib/api";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Trophy, Clock, MapPin, Calendar, RefreshCw } from "lucide-react";
import "../../styles/matches.css";

const API = API_BASE_URL;
const WS_API = WS_BASE_URL;

export default function PublicScoreboardPage() {
    const params = useParams();
    const matchId = params?.match_id;

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [wsConnected, setWsConnected] = useState(false);
    const [teamAMembers, setTeamAMembers] = useState([]);
    const [teamBMembers, setTeamBMembers] = useState([]);

    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const intentionalCloseRef = useRef(false);
    const mountedRef = useRef(true);

    // Initial HTTP fetch
    const fetchMatch = async () => {
        try {
            const r = await fetch(`${API}/matches/${matchId}`);
            if (r.ok) {
                const data = await r.json();
                setMatch(data);
            } else {
                console.error("Match not found");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // WebSocket link to backend for instant updates
    const connectWS = () => {
        if (!matchId || !mountedRef.current) return;

        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }

        if (wsRef.current) {
            intentionalCloseRef.current = true;
            wsRef.current.close();
            wsRef.current = null;
            intentionalCloseRef.current = false;
        }

        const wsUrl = `${WS_API}/ws/scoreboard/${matchId}`;
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
            console.log("Connected to live match feed");
            setWsConnected(true);
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data?.error) {
                    console.warn("Live feed:", data.error);
                    return;
                }
                setMatch(data);
            } catch (err) {
                console.error("WebSocket message parsing error:", err);
            }
        };

        socket.onclose = (event) => {
            setWsConnected(false);
            if (intentionalCloseRef.current || !mountedRef.current) return;
            if (event.code === 4004) {
                console.warn("Live feed closed: match not found");
                return;
            }
            console.log("Live feed disconnected. Retrying connection in 3 seconds...");
            reconnectTimerRef.current = setTimeout(() => {
                connectWS();
            }, 3000);
        };

        socket.onerror = () => {
            console.warn(`WebSocket connection failed (${wsUrl}), readyState=${socket.readyState}`);
            socket.close();
        };
    };

    useEffect(() => {
        mountedRef.current = true;
        fetchMatch();
        connectWS();

        return () => {
            mountedRef.current = false;
            intentionalCloseRef.current = true;
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [matchId]);

    useEffect(() => {
        if (!match) return;

        const loadTeamMembers = async () => {
            const teams = Array.isArray(match.teams) ? match.teams : [];
            const tA = teams[0];
            const tB = teams[1];
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

    if (loading) {
        return (
            <div className="pub-root">
                <div style={{ textAlign: "center" }}>
                    <div
                        className="vd-spinner"
                        style={{ width: "40px", height: "40px", borderWidth: "3px", margin: "0 auto 16px" }}
                    />
                    <p style={{ color: "var(--vd-muted)", fontSize: "14px" }}>Loading live scoreboard feed…</p>
                </div>
            </div>
        );
    }

    if (!match) {
        return (
            <div className="pub-root">
                <div className="pub-card" style={{ maxWidth: "500px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚔️</div>
                    <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#fff" }}>Match Unavailable</h2>
                    <p style={{ color: "var(--vd-muted)", marginTop: "12px", fontSize: "14px", lineHeight: "1.6" }}>
                        This match link is invalid or the match has been deleted by the administrator.
                    </p>
                </div>
            </div>
        );
    }

    const matchTeams = Array.isArray(match.teams) ? match.teams : [];
    const teamA = matchTeams[0] || { team_name: "Team A", score: 0 };
    const teamB = matchTeams[1] || { team_name: "Team B", score: 0 };
    const scheduledDate = match.scheduled_at
        ? new Date(match.scheduled_at).toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : null;

    return (
        <div className="pub-root">
            <div className="pub-container">
                {/* Scoreboard Widget */}
                <div className="pub-card">
                    {/* Status badge */}
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
                        {match.status === "live" ? (
                            <span className="pub-live-glow">
                                <span className="pub-live-dot" />
                                LIVE BROADCAST
                            </span>
                        ) : match.status === "completed" ? (
                            <span
                                className="pub-live-glow"
                                style={{
                                    color: "#475569",
                                    background: "#f1f5f9",
                                    borderColor: "#cbd5e1",
                                    boxShadow: "none"
                                }}
                            >
                                FINAL RESULT
                            </span>
                        ) : (
                            <span
                                className="pub-live-glow"
                                style={{
                                    color: "#0369a1",
                                    background: "#f0f9ff",
                                    borderColor: "#bae6fd",
                                    boxShadow: "none"
                                }}
                            >
                                UPCOMING MATCH
                            </span>
                        )}
                    </div>

                    <div className="pub-sport-chip">
                        {match.sport} MATCH
                    </div>

                    <h1 className="pub-match-title">
                        {match.title}
                    </h1>

                    {/* Scores Display (Stadium Grade Layout) */}
                    <div className="pub-score-display">
                        {/* Team A Profile */}
                        <div className="pub-team team-left">
                            <div className="pub-team-avatar" style={{ background: teamA.color || "#10b981" }}>
                                {(teamA.team_name || "A")[0].toUpperCase()}
                            </div>
                            <div className="pub-team-info">
                                <div className="pub-team-name">{teamA.team_name}</div>
                                {teamA.club_name && <div className="pub-team-club">{teamA.club_name}</div>}
                            </div>
                        </div>

                        {/* Scores Box Container */}
                        <div className="pub-score-center">
                            <div className="pub-score-box">
                                {teamA.score}
                            </div>

                            <div className="pub-vs-pill">VS</div>

                            <div className="pub-score-box">
                                {teamB.score}
                            </div>
                        </div>

                        {/* Team B Profile */}
                        <div className="pub-team team-right">
                            <div className="pub-team-avatar" style={{ background: teamB.color || "#0284c7" }}>
                                {(teamB.team_name || "B")[0].toUpperCase()}
                            </div>
                            <div className="pub-team-info">
                                <div className="pub-team-name">{teamB.team_name}</div>
                                {teamB.club_name && <div className="pub-team-club">{teamB.club_name}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Footer Info Chips */}
                    <div className="pub-footer-row">
                        {scheduledDate && (
                            <div className="pub-footer-chip">
                                <Calendar size={14} />
                                <span>{scheduledDate}</span>
                            </div>
                        )}
                        {match.venue && (
                            <div className="pub-footer-chip">
                                <MapPin size={14} />
                                <span>{match.venue}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Event Timeline Widget */}
                <div className="pub-timeline">
                    <h2
                        style={{
                            fontSize: "16px",
                            fontWeight: "800",
                            color: "#0f172a",
                            marginBottom: "20px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <span>Match Timeline</span>
                        {match.status === "live" && (
                            <span
                                style={{
                                    fontSize: "11px",
                                    color: wsConnected ? "#10b981" : "#dc2626",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <span
                                    className="pub-live-dot"
                                    style={{ backgroundColor: wsConnected ? "#10b981" : "#dc2626" }}
                                />
                                {wsConnected ? "Auto-updating in real-time" : "Connecting feed..."}
                            </span>
                        )}
                    </h2>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                            maxHeight: "360px",
                            overflowY: "auto",
                        }}
                    >
                        {match.events && match.events.length > 0 ? (
                            match.events.map((evt, idx) => (
                                <div
                                    key={evt.id || idx}
                                    className="timeline-item"
                                    style={{ borderBottom: "1px solid #f1f5f9" }}
                                >
                                    <span className="timeline-time">
                                        {evt.minute !== null && evt.minute !== undefined ? `${evt.minute}'` : "Live"}
                                    </span>
                                    <div className="timeline-info">
                                        <div className="timeline-title" style={{ fontWeight: "700" }}>
                                            {evt.event_type.replace("_", " ").toUpperCase()}
                                        </div>
                                        <div className="timeline-desc" style={{ color: "#475569" }}>
                                            {evt.description}
                                        </div>
                                    </div>
                                    {evt.score_at_event && <span className="timeline-score">{evt.score_at_event}</span>}
                                </div>
                            ))
                        ) : (
                            <div
                                style={{
                                    color: "#64748b",
                                    fontSize: "14px",
                                    textAlign: "center",
                                    padding: "40px 0",
                                }}
                            >
                                The match has not started or no events have been logged yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Team Squads Panel */}
                {(teamAMembers.length > 0 || teamBMembers.length > 0) && (
                    <div className="pub-timeline">
                        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "20px", textAlign: "center", letterSpacing: "1px" }}>
                            TEAM SQUADS & PLAYER ROSTERS
                        </h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                            {/* Team A Roster */}
                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: teamA.color || "#10b981", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>
                                    {teamA.team_name} Squad
                                </h3>
                                {teamAMembers.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {teamAMembers.map((m) => (
                                            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 12px", borderRadius: "8px" }}>
                                                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: teamA.color || "#10b981", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800" }}>
                                                    {(m.first_name || "?")[0].toUpperCase()}
                                                </div>
                                                <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{m.first_name} {m.last_name || ""}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>No players registered in this team.</span>
                                )}
                            </div>

                            {/* Team B Roster */}
                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: teamB.color || "#0284c7", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>
                                    {teamB.team_name} Squad
                                </h3>
                                {teamBMembers.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {teamBMembers.map((m) => (
                                            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 12px", borderRadius: "8px" }}>
                                                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: teamB.color || "#0284c7", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800" }}>
                                                    {(m.first_name || "?")[0].toUpperCase()}
                                                </div>
                                                <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{m.first_name} {m.last_name || ""}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                                        {teamB.club_name ? "Squad list unavailable (Guest Team)" : "No players registered in this team."}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
