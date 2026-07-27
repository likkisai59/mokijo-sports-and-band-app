"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "../../components/dashboard/Sidebar";
import TopHeader from "../../components/dashboard/TopHeader";
import MobileBottomNav from "../../components/dashboard/MobileBottomNav";
import "../styles/dashboard.css";

export default function DashboardLayout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const userRole = localStorage.getItem("userRole");
        const isMember = localStorage.getItem("isMember") === "true" || userRole === "team_member";
        const approvalStatus = localStorage.getItem("approvalStatus");

        if (!token) {
            if (isMember) {
                router.replace("/login-member");
            } else {
                router.replace("/login");
            }
            return;
        }

        if (isMember && approvalStatus !== "accepted") {
            localStorage.clear();
            router.replace("/login-member");
            return;
        }

        const adminOnlyPaths = [
            "/dashboard/creategroup",
            "/dashboard/importgroups",
            "/dashboard/groups",
            "/dashboard/signup-forms",
        ];

        const isTryingToAccessAdminOnly = adminOnlyPaths.some(path => pathname.startsWith(path));

        if (isMember && isTryingToAccessAdminOnly) {
            router.replace("/dashboard/overview");
            return;
        }

        const memberRole = (localStorage.getItem("memberRole") || "").toLowerCase().trim();
        const isReferee = isMember && memberRole === "referee";
        const refereeBlockedPaths = ["/dashboard/events", "/dashboard/members"];
        if (isReferee && refereeBlockedPaths.some((path) => pathname.startsWith(path))) {
            router.replace("/dashboard/overview");
            return;
        }

        setAuthorized(true);
    }, [pathname, router]);

    if (!authorized) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0b0d", color: "#9ca3af" }}>
                <span>Loading dashboard...</span>
            </div>
        );
    }

    return (
        <>
            <TopHeader isMobileMenuOpen={isMobileMenuOpen} onMenuToggle={() => setIsMobileMenuOpen((open) => !open)} />
            <div className="dashboard-container">
                <button
                    type="button"
                    className={`mobile-menu-scrim ${isMobileMenuOpen ? "visible" : ""}`}
                    onClick={closeMobileMenu}
                    aria-label="Close navigation"
                />
                <Sidebar isOpen={isMobileMenuOpen} onNavigate={closeMobileMenu} />
                <div className="dashboard-content">
                    <main className="main-content">{children}</main>
                </div>
            </div>
            <MobileBottomNav />
        </>
    );
}
