"use client";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Plus,
    Trophy,
    Activity,
    Calendar,
    MapPin,
    Play,
    CheckCircle,
    Trash2,
    Share2,
    ExternalLink,
} from "lucide-react";
import "../../styles/matches.css";

const API = API_BASE_URL;

export default function DashboardMatchesPage() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, live: 0, scheduled: 0, completed: 0 });

    const ownerId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

    const loadMatches = async () => {
        if (!ownerId) return;
        try {
            const r = await fetch(`${API}/matches?owner_id=${ownerId}`);
            if (r.ok) {
                const data = await r.json();
                setMatches(data);

                // Calculate stats
                const total = data.length;
                const live = data.filter((m) => m.status === "live").length;
                const scheduled = data.filter((m) => m.status === "scheduled").length;
                const completed = data.filter((m) => m.status === "completed").length;
                setStats({ total, live, scheduled, completed });
            }
        } catch (error) {
            console.error("Error fetching matches:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMatches();
    }, []);

    const startMatch = async (matchId) => {
        if (!confirm("Are you sure you want to start this match? It will go LIVE and live scoring will be enabled."))
            return;
        try {
            const r = await fetch(`${API}/matches/${matchId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "live" }),
            });
            if (r.ok) {
                loadMatches();
            } else {
                alert("Failed to start match");
            }
        } catch (error) {
            console.error("Error starting match:", error);
        }
    };

    const finishMatch = async (matchId) => {
        if (!confirm("Are you sure you want to complete this match? This will lock the score and declare the winner."))
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
                loadMatches();
            } else {
                alert("Failed to finish match");
            }
        } catch (error) {
            console.error("Error finishing match:", error);
        }
    };

    const deleteMatch = async (matchId) => {
        if (!confirm("Are you sure you want to delete this match? This action cannot be undone.")) return;
        try {
            const r = await fetch(`${API}/matches/${matchId}`, {
                method: "DELETE",
            });
            if (r.ok) {
                loadMatches();
            } else {
                alert("Failed to delete match");
            }
        } catch (error) {
            console.error("Error deleting match:", error);
        }
    };

    const copyScoreboardLink = (matchId) => {
        const url = `${window.location.origin}/scoreboard/${matchId}`;
        navigator.clipboard
            .writeText(url)
            .then(() => alert("Public scoreboard link copied to clipboard! 📋"))
            .catch(() => alert("Failed to copy link."));
    };

    return (
        <div style={{ padding: "20px" }}>
            {/* Top Page Header with New Match button on the top right */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "24px",
                }}
            >
                <div>
                    <h1
                        className="vd-page-title"
                        style={{ color: "#fff", fontSize: "28px", fontWeight: "800", margin: 0 }}
                    >
                        Live Matches & Scoreboard
                    </h1>
                    <p className="vd-page-sub" style={{ color: "var(--vd-muted)", marginTop: "4px", marginBottom: 0 }}>
                        Create, schedule, and score matches for teams in real time
                    </p>
                </div>
                <Link
                    href="/dashboard/matches/create"
                    className="m-create-btn"
                    style={{
                        textDecoration: "none",
                        backgroundColor: "#10b981",
                        color: "#fff",
                        boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                    }}
                >
                    <Plus size={16} />
                    New Match
                </Link>
            </div>

            {/* Overview Stats */}
            <div className="m-stats-grid">
                <div className="m-stat-card">
                    <div className="m-stat-icon">🏆</div>
                    <div className="m-stat-info">
                        <div className="m-stat-val">{stats.total}</div>
                        <div className="m-stat-lbl">Total Matches</div>
                    </div>
                </div>
                <div className="m-stat-card">
                    <div className="m-stat-icon" style={{ color: "#ff3b30", borderColor: "rgba(255, 59, 48, 0.15)" }}>
                        🔴
                    </div>
                    <div className="m-stat-info">
                        <div className="m-stat-val" style={{ color: "#ff3b30" }}>
                            {stats.live}
                        </div>
                        <div className="m-stat-lbl">Live Now</div>
                    </div>
                </div>
                <div className="m-stat-card">
                    <div
                        className="m-stat-icon"
                        style={{ color: "var(--vd-cyan)", borderColor: "rgba(0, 240, 255, 0.15)" }}
                    >
                        ⏳
                    </div>
                    <div className="m-stat-info">
                        <div className="m-stat-val" style={{ color: "var(--vd-cyan)" }}>
                            {stats.scheduled}
                        </div>
                        <div className="m-stat-lbl">Scheduled</div>
                    </div>
                </div>
                <div className="m-stat-card">
                    <div
                        className="m-stat-icon"
                        style={{ color: "var(--vd-muted)", borderColor: "rgba(255, 255, 255, 0.15)" }}
                    >
                        🏁
                    </div>
                    <div className="m-stat-info">
                        <div className="m-stat-val" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                            {stats.completed}
                        </div>
                        <div className="m-stat-lbl">Completed</div>
                    </div>
                </div>
            </div>

            {/* Actions & Filters */}
            <div className="m-header-actions">
                <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#fff" }}>Match Schedule</h2>
            </div>

            {/* Matches List Grid */}
            {loading ? (
                <div className="vd-loading">
                    <div className="vd-spinner" /> Loading match schedule…
                </div>
            ) : matches.length === 0 ? (
                <div
                    className="vd-card"
                    style={{
                        padding: 48,
                        textAlign: "center",
                        background: "var(--vd-surface)",
                        border: "1px solid var(--vd-border)",
                        borderRadius: "16px",
                    }}
                >
                    <div className="vd-empty">
                        <div className="vd-empty-icon" style={{ fontSize: "40px" }}>
                            ⚔️
                        </div>
                        <div
                            className="vd-empty-text"
                            style={{ fontSize: "18px", color: "#fff", fontWeight: "600", marginTop: "16px" }}
                        >
                            No Matches Scheduled
                        </div>
                        <div
                            className="vd-empty-sub"
                            style={{ color: "var(--vd-muted)", fontSize: "14px", marginTop: "8px" }}
                        >
                            Create your first match to start broadcasting live scores.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="m-grid">
                    {matches.map((match) => {
                        const teamA = match.teams[0] || { team_name: "Team A", score: 0 };
                        const teamB = match.teams[1] || { team_name: "Team B", score: 0 };
                        const dateFormatted = match.scheduled_at
                            ? new Date(match.scheduled_at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                              })
                            : "Not scheduled";

                        return (
                            <div key={match.id} className={`m-card ${match.status}`}>
                                <div className="m-card-header">
                                    <span className="m-sport-badge">{match.sport}</span>
                                    <span className={`m-status ${match.status}`}>
                                        {match.status === "live" && <span className="pub-live-dot" />}
                                        {match.status}
                                    </span>
                                </div>
                                <div className="m-card-body">
                                    <h3 className="m-title">{match.title}</h3>

                                    <div className="m-teams-vs">
                                        <div className="m-team-row">
                                            <div className="m-team-name">
                                                <span
                                                    className="m-team-color-indicator"
                                                    style={{ backgroundColor: teamA.color || "var(--vd-brand)" }}
                                                />
                                                {teamA.team_name}
                                            </div>
                                            {teamA.club_name && <div className="m-team-club">{teamA.club_name}</div>}
                                        </div>

                                        <div className="m-score-container">
                                            <span className="m-score-val">{teamA.score}</span>
                                            <span className="m-score-divider">vs</span>
                                            <span className="m-score-val">{teamB.score}</span>
                                        </div>

                                        <div className="m-team-row team-b">
                                            <div className="m-team-name">
                                                {teamB.team_name}
                                                <span
                                                    className="m-team-color-indicator"
                                                    style={{
                                                        backgroundColor: teamB.color || "var(--vd-cyan)",
                                                        marginLeft: "6px",
                                                        marginRight: 0,
                                                    }}
                                                />
                                            </div>
                                            {teamB.club_name && <div className="m-team-club">{teamB.club_name}</div>}
                                        </div>
                                    </div>

                                    <div className="m-info-footer">
                                        <div className="m-info-item">
                                            <Calendar size={14} />
                                            <span>{dateFormatted}</span>
                                        </div>
                                        {match.venue && (
                                            <div className="m-info-item">
                                                <MapPin size={14} />
                                                <span>{match.venue}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="m-card-actions">
                                    {match.status === "scheduled" && (
                                        <>
                                            <button onClick={() => startMatch(match.id)} className="m-btn start">
                                                <Play size={14} />
                                                Start Match
                                            </button>
                                            <button
                                                onClick={() => deleteMatch(match.id)}
                                                className="m-btn danger"
                                                style={{ flex: "0 0 44px" }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}

                                    {match.status === "live" && (
                                        <>
                                            <Link
                                                href={`/dashboard/matches/${match.id}/manage`}
                                                className="m-btn primary"
                                                style={{ textDecoration: "none" }}
                                            >
                                                <Activity size={14} />
                                                Scorekeep
                                            </Link>
                                            <button onClick={() => finishMatch(match.id)} className="m-btn secondary">
                                                <CheckCircle size={14} />
                                                Finish
                                            </button>
                                        </>
                                    )}

                                    {match.status === "completed" && (
                                        <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                                            <span
                                                className="m-btn secondary"
                                                style={{ cursor: "default", opacity: 0.7 }}
                                            >
                                                Finished
                                            </span>
                                            <button
                                                onClick={() => deleteMatch(match.id)}
                                                className="m-btn danger"
                                                style={{ flex: "0 0 44px" }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => copyScoreboardLink(match.id)}
                                        className="m-btn secondary"
                                        style={{ flex: "0 0 44px" }}
                                        title="Copy Live Scoreboard Link"
                                    >
                                        <Share2 size={14} />
                                    </button>
                                    <Link
                                        href={`/scoreboard/${match.id}`}
                                        target="_blank"
                                        className="m-btn secondary"
                                        style={{ flex: "0 0 44px" }}
                                        title="Open Live Scoreboard View"
                                    >
                                        <ExternalLink size={14} />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
