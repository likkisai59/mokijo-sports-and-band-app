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
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                        {match.status === "live" ? (
                            <span className="pub-live-glow">
                                <span className="pub-live-dot" />
                                LIVE BROADCAST
                            </span>
                        ) : match.status === "completed" ? (
                            <span
                                className="pub-live-glow"
                                style={{
                                    color: "var(--vd-muted)",
                                    background: "rgba(255,255,255,0.04)",
                                    borderColor: "rgba(255,255,255,0.15)",
                                }}
                            >
                                FINAL RESULT
                            </span>
                        ) : (
                            <span
                                className="pub-live-glow"
                                style={{
                                    color: "var(--vd-cyan)",
                                    background: "rgba(217, 255, 110, 0.04)",
                                    borderColor: "rgba(217, 255, 110, 0.2)",
                                }}
                            >
                                UPCOMING MATCH
                            </span>
                        )}
                    </div>

                    <div
                        style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            color: "var(--vd-brand)",
                            letterSpacing: "1px",
                        }}
                    >
                        {match.sport} Match
                    </div>

                    <h1
                        style={{
                            fontSize: "24px",
                            fontWeight: "800",
                            color: "#fff",
                            marginTop: "8px",
                            marginBottom: "28px",
                        }}
                    >
                        {match.title}
                    </h1>

                    {/* Scores Display */}
                    <div className="pub-score-display">
                        {/* Team A */}
                        <div className="pub-team" style={{ textAlign: "right" }}>
                            <div className="pub-team-name" style={{ color: teamA.color || "var(--vd-brand)" }}>
                                {teamA.team_name}
                            </div>
                            {teamA.club_name && <div className="pub-team-club">{teamA.club_name}</div>}
                        </div>

                        {/* Team A Score */}
                        <div
                            className="pub-score-num"
                            style={{ textShadow: `0 0 30px ${teamA.color || "var(--vd-brand)"}22` }}
                        >
                            {teamA.score}
                        </div>

                        <div className="pub-vs">vs</div>

                        {/* Team B Score */}
                        <div
                            className="pub-score-num"
                            style={{ textShadow: `0 0 30px ${teamB.color || "var(--vd-cyan)"}22` }}
                        >
                            {teamB.score}
                        </div>

                        {/* Team B */}
                        <div className="pub-team" style={{ textAlign: "left" }}>
                            <div className="pub-team-name" style={{ color: teamB.color || "var(--vd-cyan)" }}>
                                {teamB.team_name}
                            </div>
                            {teamB.club_name && <div className="pub-team-club">{teamB.club_name}</div>}
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "24px",
                            fontSize: "13px",
                            color: "var(--vd-muted)",
                            borderTop: "1px solid rgba(255,255,255,0.06)",
                            paddingTop: "24px",
                            marginTop: "12px",
                        }}
                    >
                        {scheduledDate && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Calendar size={14} />
                                <span>{scheduledDate}</span>
                            </div>
                        )}
                        {match.venue && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
                            color: "#fff",
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
                                    color: wsConnected ? "var(--vd-brand)" : "#ff3b30",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <span
                                    className="pub-live-dot"
                                    style={{ backgroundColor: wsConnected ? "var(--vd-brand)" : "#ff3b30" }}
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
                                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                                >
                                    <span className="timeline-time">
                                        {evt.minute !== null && evt.minute !== undefined ? `${evt.minute}'` : "Live"}
                                    </span>
                                    <div className="timeline-info">
                                        <div className="timeline-title" style={{ fontWeight: "700" }}>
                                            {evt.event_type.replace("_", " ").toUpperCase()}
                                        </div>
                                        <div className="timeline-desc" style={{ color: "rgba(255,255,255,0.7)" }}>
                                            {evt.description}
                                        </div>
                                    </div>
                                    {evt.score_at_event && <span className="timeline-score">{evt.score_at_event}</span>}
                                </div>
                            ))
                        ) : (
                            <div
                                style={{
                                    color: "var(--vd-muted)",
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
                    <div className="pub-timeline" style={{ background: "rgba(20, 20, 31, 0.4)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#fff", marginBottom: "20px", textAlign: "center", letterSpacing: "1px" }}>
                            TEAM SQUADS & PLAYER ROSTERS
                        </h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                            {/* Team A Roster */}
                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: teamA.color || "var(--vd-brand)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "8px", marginBottom: "12px" }}>
                                    {teamA.team_name} Squad
                                </h3>
                                {teamAMembers.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {teamAMembers.map((m) => (
                                            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255, 255, 255, 0.02)", padding: "8px 12px", borderRadius: "8px" }}>
                                                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: teamA.color || "var(--vd-brand)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800" }}>
                                                    {(m.first_name || "?")[0].toUpperCase()}
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
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: teamB.color || "var(--vd-cyan)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "8px", marginBottom: "12px" }}>
                                    {teamB.team_name} Squad
                                </h3>
                                {teamBMembers.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {teamBMembers.map((m) => (
                                            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255, 255, 255, 0.02)", padding: "8px 12px", borderRadius: "8px" }}>
                                                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: teamB.color || "var(--vd-cyan)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800" }}>
                                                    {(m.first_name || "?")[0].toUpperCase()}
                                                </div>
                                                <span style={{ fontSize: "13px", fontWeight: "500", color: "#e2e8f0" }}>{m.first_name} {m.last_name || ""}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span style={{ fontSize: "12px", color: "var(--vd-muted)" }}>
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
