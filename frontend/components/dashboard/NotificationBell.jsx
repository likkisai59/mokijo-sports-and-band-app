"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

function parseApplicantName(sub) {
    let parsedData = {};
    try {
        parsedData =
            typeof sub.submitted_data === "string" ? JSON.parse(sub.submitted_data) : sub.submitted_data || {};
    } catch {
        parsedData = {};
    }
    const firstName = parsedData.first_name || parsedData.firstName || "Applicant";
    const lastName = parsedData.last_name || parsedData.lastName || "";
    return `${firstName} ${lastName}`.trim();
}

/**
 * Gold notification bell for dashboard headers.
 * Club admins see signup applications; other roles see an empty state.
 */
export default function NotificationBell({
    mode = "auto", // "admin" | "empty" | "auto"
    applicationsHref = "/dashboard/signup-forms",
}) {
    const [open, setOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(mode === "admin");
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (mode === "admin") {
            setIsAdmin(true);
            return;
        }
        if (mode === "empty") {
            setIsAdmin(false);
            return;
        }
        const role = (localStorage.getItem("userRole") || "").toLowerCase();
        const isMember = localStorage.getItem("isMember") === "true" || role === "team_member";
        const admin =
            !isMember &&
            (role === "club_admin" || role === "admin" || role === "owner" || role === "" || !!localStorage.getItem("userId"));
        // Prefer explicit non-admin roles for empty state
        if (role === "venue_owner" || role === "user" || role === "player" || isMember) {
            setIsAdmin(false);
        } else {
            setIsAdmin(admin && !isMember);
        }
    }, [mode]);

    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, [open]);

    useEffect(() => {
        if (!isAdmin) return;
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/signup-submissions?owner_id=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled) setApplications(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Error loading notifications:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [isAdmin]);

    const pendingCount = isAdmin ? applications.length : 0;

    return (
        <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                aria-label="Notifications"
                onClick={() => setOpen((prev) => !prev)}
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    border: "1px solid rgba(234, 179, 8, 0.35)",
                    background: "rgba(234, 179, 8, 0.12)",
                    color: "#facc15",
                    cursor: "pointer",
                    padding: 0,
                }}
            >
                <Bell size={18} fill="currentColor" strokeWidth={1.5} />
                {pendingCount > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: -2,
                            right: -2,
                            minWidth: 16,
                            height: 16,
                            borderRadius: 8,
                            background: "#ef4444",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 4px",
                            lineHeight: 1,
                        }}
                    >
                        {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "120%",
                        right: 0,
                        width: 320,
                        maxHeight: 360,
                        overflowY: "auto",
                        backgroundColor: "#0f0f1a",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: 10,
                        padding: 8,
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                        zIndex: 1100,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 10px",
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                            marginBottom: 6,
                        }}
                    >
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Notifications</span>
                        {isAdmin && (
                            <Link
                                href={applicationsHref}
                                onClick={() => setOpen(false)}
                                style={{ fontSize: 12, color: "#facc15", textDecoration: "none" }}
                            >
                                View all
                            </Link>
                        )}
                    </div>

                    {!isAdmin && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            No notifications
                        </p>
                    )}

                    {isAdmin && loading && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            Loading...
                        </p>
                    )}

                    {isAdmin && !loading && applications.length === 0 && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            No applications
                        </p>
                    )}

                    {isAdmin &&
                        !loading &&
                        applications.slice(0, 8).map((sub) => (
                            <Link
                                key={sub.id}
                                href={applicationsHref}
                                onClick={() => setOpen(false)}
                                style={{
                                    display: "block",
                                    padding: "10px",
                                    borderRadius: 8,
                                    textDecoration: "none",
                                    color: "#e2e8f0",
                                    marginBottom: 4,
                                    background: "rgba(255,255,255,0.03)",
                                }}
                            >
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{parseApplicantName(sub)}</div>
                                <div style={{ fontSize: 11, color: "rgba(148,163,184,0.75)", marginTop: 2 }}>
                                    {sub.role || "Applicant"} · Waiting approval
                                </div>
                            </Link>
                        ))}
                </div>
            )}
        </div>
    );
}
