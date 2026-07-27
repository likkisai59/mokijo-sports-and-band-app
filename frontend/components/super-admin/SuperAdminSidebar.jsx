"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { LayoutDashboard, Clock, CheckCircle2, Building2 } from "lucide-react";

export default function SuperAdminSidebar() {
    const pathname = usePathname();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/superadmin/pending-clubs`);
                if (res.ok) {
                    const data = await res.json();
                    setPendingCount(data ? data.length : 0);
                }
            } catch (err) {
                console.error("Error fetching pending count:", err);
            }
        };

        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <span className="club-badge" style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}>
                    SA
                </span>
                <span className="club-name-text">Super Admin</span>
            </div>

            {/* Menu Item 1: Dashboard */}
            <Link
                href="/super-admin/dashboard/overview"
                className={`menu-item ${pathname === "/super-admin/dashboard/overview" || pathname === "/super-admin/dashboard" ? "active" : ""}`}
                style={{ textDecoration: "none" }}
            >
                <span className="icon">
                    <LayoutDashboard size={20} />
                </span>
                <span>Dashboard</span>
            </Link>

            {/* Menu Item 2: Pending Approvals */}
            <Link
                href="/super-admin/dashboard/pending-approvals"
                className={`menu-item ${pathname === "/super-admin/dashboard/pending-approvals" ? "active" : ""}`}
                style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span className="icon">
                        <Clock size={20} />
                    </span>
                    <span>Pending Approvals</span>
                </div>
                {pendingCount > 0 && (
                    <span
                        style={{
                            background: "#ef4444",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "2px 7px",
                            borderRadius: "10px",
                        }}
                    >
                        {pendingCount}
                    </span>
                )}
            </Link>

            {/* Menu Item 3: Approved Clubs */}
            <Link
                href="/super-admin/dashboard/approved-clubs"
                className={`menu-item ${pathname === "/super-admin/dashboard/approved-clubs" ? "active" : ""}`}
                style={{ textDecoration: "none" }}
            >
                <span className="icon">
                    <CheckCircle2 size={20} />
                </span>
                <span>Approved Clubs</span>
            </Link>

            {/* Menu Item 4: All Clubs */}
            <Link
                href="/super-admin/dashboard/all-clubs"
                className={`menu-item ${pathname === "/super-admin/dashboard/all-clubs" ? "active" : ""}`}
                style={{ textDecoration: "none" }}
            >
                <span className="icon">
                    <Building2 size={20} />
                </span>
                <span>All Clubs</span>
            </Link>
        </aside>
    );
}
