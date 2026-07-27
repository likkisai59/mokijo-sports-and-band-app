"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { Building2, Clock, CheckCircle2, Users, ArrowRight } from "lucide-react";

export default function SuperAdminOverviewPage() {
    const [stats, setStats] = useState({
        total_clubs: 0,
        pending_clubs: 0,
        approved_clubs: 0,
        total_members: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/superadmin/dashboard-stats`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const kpiCards = [
        {
            title: "Total Clubs Registered",
            value: stats.total_clubs,
            icon: Building2,
            color: "#818cf8",
            bgColor: "rgba(99, 102, 241, 0.12)",
            borderColor: "rgba(99, 102, 241, 0.3)",
            link: "/super-admin/dashboard/all-clubs",
        },
        {
            title: "Pending Approvals",
            value: stats.pending_clubs,
            icon: Clock,
            color: "#fbbf24",
            bgColor: "rgba(251, 191, 36, 0.12)",
            borderColor: "rgba(251, 191, 36, 0.3)",
            link: "/super-admin/dashboard/pending-approvals",
        },
        {
            title: "Approved Active Clubs",
            value: stats.approved_clubs,
            icon: CheckCircle2,
            color: "#4ade80",
            bgColor: "rgba(34, 197, 94, 0.12)",
            borderColor: "rgba(34, 197, 94, 0.3)",
            link: "/super-admin/dashboard/approved-clubs",
        },
        {
            title: "Platform Total Members",
            value: stats.total_members,
            icon: Users,
            color: "#38bdf8",
            bgColor: "rgba(56, 189, 248, 0.12)",
            borderColor: "rgba(56, 189, 248, 0.3)",
            link: "/super-admin/dashboard/approved-clubs",
        },
    ];

    return (
        <div style={{ padding: "8px 0", color: "#f8fafc" }}>
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 6px 0", color: "#ffffff" }}>
                    Super Admin Executive Dashboard
                </h1>
                <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
                    Overview of registered sports clubs and pending approval requests across Mukijo platform.
                </p>
            </div>

            {/* KPI Cards Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "20px",
                    marginBottom: "32px",
                }}
            >
                {kpiCards.map((card, idx) => {
                    const IconComp = card.icon;
                    return (
                        <div
                            key={idx}
                            style={{
                                background: "#0f0f1a",
                                border: `1px solid ${card.borderColor}`,
                                borderRadius: "14px",
                                padding: "20px",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: "500" }}>{card.title}</span>
                                <div
                                    style={{
                                        width: "38px",
                                        height: "38px",
                                        borderRadius: "10px",
                                        backgroundColor: card.bgColor,
                                        color: card.color,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <IconComp size={20} />
                                </div>
                            </div>
                            <div style={{ fontSize: "28px", fontWeight: "800", color: "#ffffff", marginBottom: "12px" }}>
                                {loading ? "..." : card.value}
                            </div>
                            <Link
                                href={card.link}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    fontSize: "12px",
                                    color: card.color,
                                    textDecoration: "none",
                                    fontWeight: "600",
                                }}
                            >
                                <span>Manage</span>
                                <ArrowRight size={12} />
                            </Link>
                        </div>
                    );
                })}
            </div>

            {/* Quick Action Navigation Box */}
            <div
                style={{
                    background: "#0f0f1a",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "24px",
                }}
            >
                <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#ffffff", margin: "0 0 16px 0" }}>
                    Quick Management Actions
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
                    <Link
                        href="/super-admin/dashboard/pending-approvals"
                        style={{
                            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                            color: "#ffffff",
                            padding: "12px 20px",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontSize: "14px",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                        }}
                    >
                        <Clock size={16} />
                        <span>Review Pending Approvals ({stats.pending_clubs})</span>
                    </Link>

                    <Link
                        href="/super-admin/dashboard/approved-clubs"
                        style={{
                            background: "rgba(255, 255, 255, 0.06)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            color: "#ffffff",
                            padding: "12px 20px",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontSize: "14px",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <CheckCircle2 size={16} style={{ color: "#4ade80" }} />
                        <span>View Approved Clubs ({stats.approved_clubs})</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
