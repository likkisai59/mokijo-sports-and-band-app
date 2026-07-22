"use client";
import { API_BASE_URL } from "@/lib/api";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import "./fundraising.css";
import "../../styles/payments-page.css";

function formatMoney(value) {
    return `\u20B9${Number(value || 0).toLocaleString("en-IN")}`;
}

function displayStatus(status) {
    return status === "paid" ? "Paid" : "Unpaid";
}

function pct(raised, goal) {
    if (!goal || goal <= 0) return 0;
    return Math.min(100, Math.round((raised / goal) * 100));
}

function daysLeft(deadline) {
    if (!deadline) return null;
    const diff = new Date(deadline) - new Date();
    const d = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return d > 0 ? d : 0;
}

function fmt(n) {
    return `Rs. ${Number(n).toLocaleString("en-IN")}`;
}

const STATUS_COLORS = {
    active: { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399", label: "Active", border: "rgba(16,185,129,0.3)" },
    paused: { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", label: "Paused", border: "rgba(245,158,11,0.3)" },
    completed: { bg: "rgba(139, 92, 246, 0.15)", text: "#a78bfa", label: "Completed", border: "rgba(139,92,246,0.3)" },
};

function CampaignCard({ c, onDelete }) {
    const progress = pct(c.raised, c.goal);
    const days = daysLeft(c.deadline);
    const sc = STATUS_COLORS[c.status] || STATUS_COLORS.active;
    const isMember = typeof window !== "undefined" ? localStorage.getItem("isMember") === "true" : false;

    return (
        <div className="campaign-card">
            {/* Color-coded top accent bar */}
            <div
                style={{
                    height: "3px",
                    background:
                        c.status === "active"
                            ? "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)"
                            : c.status === "paused"
                              ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                              : "linear-gradient(90deg, #8b5cf6, #a78bfa)",
                }}
            />

            <div style={{ padding: "24px", flex: 1 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "16px",
                    }}
                >
                    <div style={{ flex: 1, marginRight: "12px" }}>
                        <h3
                            style={{
                                margin: "0 0 4px",
                                fontSize: "17px",
                                fontWeight: "700",
                                color: "#f1f5f9",
                                lineHeight: "1.3",
                            }}
                        >
                            {c.title}
                        </h3>
                        {c.group_name && (
                            <span style={{ fontSize: "12px", color: "rgba(148,163,184,0.55)" }}>{c.group_name}</span>
                        )}
                    </div>
                    <span
                        style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            background: sc.bg,
                            color: sc.text,
                            border: `1px solid ${sc.border}`,
                            flexShrink: 0,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                        }}
                    >
                        {sc.label}
                    </span>
                </div>

                {c.description && (
                    <p
                        style={{
                            fontSize: "13px",
                            color: "rgba(148,163,184,0.6)",
                            lineHeight: "1.6",
                            margin: "0 0 18px",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {c.description}
                    </p>
                )}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        marginBottom: "10px",
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: "24px",
                                fontWeight: "800",
                                color: "#f1f5f9",
                                letterSpacing: "-0.5px",
                                lineHeight: 1,
                            }}
                        >
                            {fmt(c.raised)}
                        </div>
                        <div style={{ fontSize: "12px", color: "rgba(148,163,184,0.45)", marginTop: "3px" }}>
                            raised of {fmt(c.goal)}
                        </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "26px", fontWeight: "800", color: "#818cf8", lineHeight: 1 }}>
                            {progress}%
                        </div>
                        <div style={{ fontSize: "12px", color: "rgba(148,163,184,0.45)", marginTop: "3px" }}>
                            {c.donors_count || 0} donors
                        </div>
                    </div>
                </div>

                <div className="campaign-progress-bg">
                    <div
                        style={{
                            height: "100%",
                            width: `${progress}%`,
                            background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)",
                            borderRadius: "99px",
                            transition: "width 0.8s ease",
                            boxShadow: "0 0 8px rgba(99,102,241,0.4)",
                        }}
                    />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "rgba(148,163,184,0.4)" }}>
                        {days !== null ? (days === 0 ? "Deadline today" : `${days} days left`) : "No deadline"}
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <Link href={`/dashboard/fundraising/donate/${c.id}`} className="btn-donate">
                            Donate
                        </Link>
                        {!isMember && (
                            <button onClick={() => onDelete(c.id)} className="btn-delete">
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function FundraisingPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const isMember = typeof window !== "undefined" ? localStorage.getItem("isMember") === "true" : false;

    // Payments states
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(true);
    const [paymentsError, setPaymentsError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchCampaigns = async () => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        try {
            const res = await fetch(`${API_BASE_URL}/fundraising?owner_id=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data);
            }
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPayments = async () => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        setPaymentsLoading(true);
        setPaymentsError("");

        try {
            const [paymentsResponse, membersResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/payments/member-status?owner_id=${userId}`, {
                    headers: { "X-Is-Member": "false" },
                }),
                fetch(`${API_BASE_URL}/members?owner_id=${userId}`),
            ]);

            if (paymentsResponse.ok && membersResponse.ok) {
                const paymentsData = await paymentsResponse.json();
                const membersData = await membersResponse.json();

                const membersById = new Map((membersData || []).map((member) => [String(member.id), member]));
                const paymentsWithMemberGroups = (paymentsData || []).map((payment) => {
                    const member = membersById.get(String(payment.member_id));
                    return {
                        ...payment,
                        member_group_name:
                            payment.member_group_name || member?.group_name || payment.group_name || "N/A",
                    };
                });

                setPayments(paymentsWithMemberGroups);
            } else {
                setPaymentsError("Could not load member payment records.");
            }
        } catch (err) {
            console.error("Error loading member payment data:", err);
            setPaymentsError("Could not load member payment records.");
        } finally {
            setPaymentsLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
        if (!isMember) {
            fetchPayments();
        }
    }, []);

    const filteredPayments = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return payments;

        return payments.filter((payment) => {
            const searchableText = [
                payment.full_name,
                payment.email,
                payment.role,
                payment.sport,
                payment.member_group_name,
                payment.payment_for,
                payment.status,
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        });
    }, [payments, searchQuery]);

    const handleDelete = async (id) => {
        if (!confirm("Delete this campaign?")) return;
        const userId = localStorage.getItem("userId");

        try {
            const res = await fetch(`${API_BASE_URL}/fundraising/${id}?owner_id=${userId}`, {
                method: "DELETE",
            });
            if (res.ok) fetchCampaigns();
        } catch {
            alert("Failed to delete campaign");
        }
    };

    const filtered = filter === "all" ? campaigns : campaigns.filter((c) => c.status === filter);
    const totalRaised = campaigns.reduce((s, c) => s + Number(c.raised || 0), 0);
    const totalGoal = campaigns.reduce((s, c) => s + Number(c.goal || 0), 0);
    const activeCnt = campaigns.filter((c) => c.status === "active").length;

    return (
        <div className="fr-container">
            {/* Header section (Simple overall title) */}
            <div className="fr-header" style={{ marginBottom: "32px" }}>
                <div>
                    <h1 className="fr-title">Fundraising & Payments</h1>
                    <p className="fr-subtitle">
                        Manage your club's campaigns, donations, and group member payments in one place.
                    </p>
                </div>
            </div>

            {/* Payments Section (Moved to top) */}
            {!isMember && (
                <div className="payments-container" style={{ marginBottom: "48px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "40px" }}>
                    <div className="payments-header" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                        <div>
                            <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "700", color: "#f1f5f9" }}>Member Payments</h2>
                            <p style={{ margin: 0, fontSize: "14px", color: "rgba(148,163,184,0.55)" }}>All club group members with full name, email, role, sport, payment, amount, and paid status.</p>
                        </div>
                        <Link href="/dashboard/fundraising/new" className="btn-primary">
                            <svg
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                            >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New Campaign
                        </Link>
                    </div>

                    <div className="payments-table-toolbar" style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "stretch", marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "14px", color: "rgba(148, 163, 184, 0.55)", margin: 0 }}>{filteredPayments.length} records found</span>
                        </div>
                        <div className="search-wrapper" style={{ width: "100%", maxWidth: "100%", flex: "1 1 auto" }}>
                            <span className="search-icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    width="18"
                                    height="18"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    fill="none"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                className="search-input"
                                style={{ width: "100%", maxWidth: "100%" }}
                                placeholder="Search payments by name, email, group, status..."
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                aria-label="Search payments"
                            />
                        </div>
                    </div>

                    {paymentsError && <div className="payments-error" style={{ color: "#ef4444", marginBottom: "16px" }}>{paymentsError}</div>}

                    {paymentsLoading ? (
                        <div className="loading-wrapper" style={{ padding: "40px 0", textAlign: "center" }}>
                            <div className="spinner" style={{ margin: "0 auto 12px" }} />
                            <p className="loading-text" style={{ color: "rgba(148,163,184,0.55)", fontSize: "14px" }}>Loading member payments...</p>
                        </div>
                    ) : filteredPayments.length > 0 ? (
                        <div className="table-responsive">
                            <table className="payments-table">
                                <thead>
                                    <tr>
                                        <th>Full Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Sports</th>
                                        <th>Group</th>
                                        <th>Payment For</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.map((payment, index) => (
                                        <tr key={`${payment.member_id}-${payment.payment_id || "none"}-${index}`}>
                                            <td>
                                                <span className="member-name">{payment.full_name || "-"}</span>
                                            </td>
                                            <td>
                                                <span className="member-email">{payment.email || "-"}</span>
                                            </td>
                                            <td>
                                                <span className="role-badge">{payment.role || "Member"}</span>
                                            </td>
                                            <td>
                                                <div className="sport-cell">
                                                    <span className="sport-badge">{payment.sport || "N/A"}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="group-badge">{payment.member_group_name || "N/A"}</span>
                                            </td>
                                            <td>
                                                <span className="payment-title">
                                                    {payment.payment_for || "No Assigned Payments"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="amount-text">{formatMoney(payment.amount)}</span>
                                            </td>
                                            <td>
                                                <span
                                                    className={`status-pill status-${payment.status === "paid" ? "paid" : "unpaid"}`}
                                                >
                                                    {displayStatus(payment.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: "40px 0", textAlign: "center", border: "1.5px dashed rgba(255,255,255,0.08)", borderRadius: "12px" }}>
                            <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#f1f5f9" }}>No Records Found</h3>
                            <p style={{ margin: 0, fontSize: "14px", color: "rgba(148,163,184,0.55)" }}>Try another search or add members and payments to the club.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Fundraising Campaigns Section (Moved to bottom) */}
            <div style={{ marginTop: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
                    <div>
                        <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "700", color: "#f1f5f9" }}>Fundraising Campaigns</h2>
                        <p style={{ margin: 0, fontSize: "14px", color: "rgba(148,163,184,0.55)" }}>
                            {isMember
                                ? "Support your sports academy campaigns and track total club contributions"
                                : "Manage campaigns and track money raised for your club"}
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                            className="fr-filter-tabs"
                            style={{
                                display: "flex",
                                gap: "4px",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                padding: "4px",
                                borderRadius: "10px",
                            }}
                        >
                            {["all", "active", "paused", "completed"].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    style={{
                                        border: "none",
                                        background: filter === f ? "rgba(99,102,241,0.2)" : "transparent",
                                        color: filter === f ? "#a5b4fc" : "rgba(148,163,184,0.55)",
                                        boxShadow: filter === f ? "0 0 12px rgba(99,102,241,0.15)" : "none",
                                        borderRadius: "7px",
                                        padding: "6px 14px",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        transition: "all .2s",
                                        fontFamily: "'Outfit', sans-serif",
                                    }}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                    <span style={{ fontSize: "14px", color: "rgba(148, 163, 184, 0.55)" }}>
                        {filtered.length} Campaign{filtered.length !== 1 ? "s" : ""} found
                    </span>
                </div>

                {loading ? (
                    <div
                        style={{
                            padding: "80px 40px",
                            textAlign: "center",
                            background: "rgba(15,15,26,0.85)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "20px",
                            backdropFilter: "blur(12px)",
                        }}
                    >
                        <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "700", color: "#f1f5f9" }}>
                            Loading campaigns...
                        </h3>
                    </div>
                ) : filtered.length > 0 ? (
                    <div
                        className="campaign-grid"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                            gap: "24px",
                        }}
                    >
                        {filtered.map((c) => (
                            <CampaignCard key={c.id} c={c} onDelete={handleDelete} />
                        ))}
                    </div>
                ) : (
                    <div
                        style={{
                            padding: "80px 40px",
                            textAlign: "center",
                            background: "rgba(15,15,26,0.85)",
                            border: "1.5px dashed rgba(255,255,255,0.08)",
                            borderRadius: "20px",
                            backdropFilter: "blur(12px)",
                        }}
                    >
                        <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "700", color: "#f1f5f9" }}>
                            No campaigns yet
                        </h3>
                        <p style={{ margin: "0 0 28px", fontSize: "14px", color: "rgba(148,163,184,0.55)" }}>
                            {isMember
                                ? "There are currently no active fundraising campaigns scheduled. Check back soon!"
                                : "Launch your first fundraising campaign today."}
                        </p>
                        {!isMember && (
                            <Link href="/dashboard/fundraising/new" className="btn-primary">
                                + Create First Campaign
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
