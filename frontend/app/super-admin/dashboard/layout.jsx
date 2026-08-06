"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import SuperAdminSidebar from "@/components/super-admin/SuperAdminSidebar";
import SuperAdminTopHeader from "@/components/super-admin/SuperAdminTopHeader";
import { navigateToDashboard } from "@/lib/sportsLogin";
import "@/app/styles/dashboard.css";

export default function SuperAdminDashboardLayout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    const pathname = usePathname();

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    useEffect(() => {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("access_token");
        const userRole = localStorage.getItem("userRole");

        if (!token || userRole !== "superadmin") {
            navigateToDashboard("/super-admin/login");
            return;
        }

        setAuthorized(true);
    }, [pathname]);

    if (!authorized) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0b0d", color: "#9ca3af" }}>
                <span>Loading SuperAdmin portal...</span>
            </div>
        );
    }

    return (
        <>
            <SuperAdminTopHeader isMobileMenuOpen={isMobileMenuOpen} onMenuToggle={() => setIsMobileMenuOpen((open) => !open)} />
            <div className="dashboard-container">
                <button
                    type="button"
                    className={`mobile-menu-scrim ${isMobileMenuOpen ? "visible" : ""}`}
                    onClick={closeMobileMenu}
                    aria-label="Close navigation"
                />
                <SuperAdminSidebar isOpen={isMobileMenuOpen} onNavigate={closeMobileMenu} />
                <div className="dashboard-content">
                    <main className="main-content">{children}</main>
                </div>
            </div>
        </>
    );
}
