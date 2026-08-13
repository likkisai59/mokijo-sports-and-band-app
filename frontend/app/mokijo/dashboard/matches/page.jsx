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
    Sparkles,
} from "lucide-react";
import "@/app/styles/matches.css";

const API = API_BASE_URL;

export default function DashboardMatchesPage() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, live: 0, scheduled: 0, completed: 0 });

    const ownerId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    const isMember = typeof window !== "undefined" ? localStorage.getItem("isMember") === "true" : false;

    const loadMatches = async () => {
        if (!ownerId) return;
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const r = await fetch(`${API}/matches?owner_id=${ownerId}`, { headers });
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
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        try {
            const r = await fetch(`${API}/matches/${matchId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
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
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        try {
            const r = await fetch(`${API}/matches/${matchId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
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
        <div className="matches-page-wrapper">
            {/* Top Page Header Hero Control Center Banner */}
            <header className="matches-header">
                <div>
                    <div className="brand-pill-badge">
                        <Sparkles size={13} />
                        <span>MUKIJO • LIVE MATCH & SCOREBOARD HUB</span>
                    </div>
                    <h1>Live Matches & Scoreboard</h1>
                    <p>Schedule matches, broadcast live scores, manage real-time team stats, and share public scoreboards.</p>
                </div>
                <div className="header-actions-right">
                    <div className="header-status-chip">
                        <span className="status-live-dot" /> Live Scorekeeper Active
                    </div>
                    {!isMember && (
                        <Link
                            href="/dashboard/matches/create"
                            className="m-create-btn"
                        >
                            <Plus size={15} />
                            <span>New Match</span>
                        </Link>
                    )}
                </div>
            </header>

            {/* Overview Stats */}
            <div className="m-stats-grid">
                <div className="m-stat-card theme-emerald">
                    <div className="m-stat-icon">🏆</div>
                    <div className="m-stat-info">
                        <div className="m-stat-val">{stats.total}</div>
                        <div className="m-stat-lbl">Total Matches</div>
                    </div>
                </div>
                <div className="m-stat-card theme-rose">
                    <div className="m-stat-icon">
                        <span className="live-pulse-ring" />
                        🔴
                    </div>
                    <div className="m-stat-info">
                        <div className="m-stat-val val-rose">
                            {stats.live}
                        </div>
                        <div className="m-stat-lbl">Live Now</div>
                    </div>
                </div>
                <div className="m-stat-card theme-sky">
                    <div className="m-stat-icon">
                        ⏳
                    </div>
                    <div className="m-stat-info">
                        <div className="m-stat-val val-sky">
                            {stats.scheduled}
                        </div>
                        <div className="m-stat-lbl">Scheduled</div>
                    </div>
                </div>
                <div className="m-stat-card theme-slate">
                    <div className="m-stat-icon">
                        🏁
                    </div>
                    <div className="m-stat-info">
                        <div className="m-stat-val val-slate">
                            {stats.completed}
                        </div>
                        <div className="m-stat-lbl">Completed</div>
                    </div>
                </div>
            </div>

            {/* Schedule Section Header */}
            <div className="m-schedule-header">
                <h2>Match Schedule ({matches.length})</h2>
                <span className="schedule-meta-badge">Real-Time Fixtures</span>
            </div>

            {/* Matches List Grid */}
            {loading ? (
                <div className="vd-loading">
                    <div className="vd-spinner" /> Loading match schedule…
                </div>
            ) : matches.length === 0 ? (
                <div className="matches-empty-card">
                    <div className="vd-empty">
                        <div className="vd-empty-icon" style={{ fontSize: "40px" }}>
                            ⚔️
                        </div>
                        <div
                            className="vd-empty-text"
                            style={{ fontSize: "18px", color: "#0f172a", fontWeight: "700", marginTop: "12px" }}
                        >
                            No Matches Scheduled Yet
                        </div>
                        <div
                            className="vd-empty-sub"
                            style={{ color: "#64748b", fontSize: "14px", marginTop: "6px" }}
                        >
                            Create your first match to start broadcasting live scores and managing team scoreboards.
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
                                            {!isMember && (
                                                <button
                                                    onClick={() => deleteMatch(match.id)}
                                                    className="m-btn danger"
                                                    style={{ flex: "0 0 44px" }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
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
                                            {!isMember && (
                                                <button
                                                    onClick={() => deleteMatch(match.id)}
                                                    className="m-btn danger"
                                                    style={{ flex: "0 0 44px" }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
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
