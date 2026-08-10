"use client";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, ShieldAlert } from "lucide-react";
import NotificationBell from "@/components/dashboard/NotificationBell";

export default function SuperAdminTopHeader({ isMobileMenuOpen = false, onMenuToggle }) {
    const [userName, setUserName] = useState("Super Admin");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        const storedName = localStorage.getItem("userName") || "Super Admin";
        setUserName(storedName);
    }, []);

    useEffect(() => {
        if (!dropdownOpen) return;
        const closeDropdown = () => setDropdownOpen(false);
        document.addEventListener("click", closeDropdown);
        return () => document.removeEventListener("click", closeDropdown);
    }, [dropdownOpen]);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    return (
        <header className="top-header">
            <div className="top-header-brand">
                <button
                    type="button"
                    className="mobile-menu-button"
                    onClick={onMenuToggle}
                    aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
                    aria-expanded={isMobileMenuOpen}
                >
                    {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
                <span className="mkt-brand text-[24px] md:text-[28px] font-black uppercase tracking-wider text-black">MUKIJO</span>
                <span
                    style={{
                        fontSize: "11px",
                        background: "rgba(99, 102, 241, 0.2)",
                        color: "#818cf8",
                        border: "1px solid rgba(99, 102, 241, 0.4)",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <ShieldAlert size={12} /> Super Admin
                </span>
            </div>

            <div className="user-box" style={{ position: "relative", display: "flex", alignItems: "center", gap: "14px" }}>
                <NotificationBell mode="admin" />
                <div
                    className="user-profile-trigger"
                    onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen((prev) => !prev);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                >
                    <div className="user-avatar" style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}>
                        SA
                    </div>
                    <span className="user-name">{userName}</span>
                </div>

                {dropdownOpen && (
                    <div
                        className="user-dropdown"
                        style={{
                            position: "absolute",
                            top: "120%",
                            right: 0,
                            backgroundColor: "#0f0f1a",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "8px",
                            padding: "6px",
                            minWidth: "150px",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                            zIndex: 1000,
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                        }}
                    >
                        <button
                            className="top-logout-btn"
                            onClick={handleLogout}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 12px",
                                border: "none",
                                background: "transparent",
                                color: "#ff4d4f",
                                cursor: "pointer",
                                fontSize: "14px",
                                borderRadius: "4px",
                                transition: "background 0.2s",
                            }}
                        >
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
