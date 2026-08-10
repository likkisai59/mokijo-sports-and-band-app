"use client";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import Link from "next/link";
import NotificationBell from "./NotificationBell";

export default function TopHeader({ isMobileMenuOpen = false, onMenuToggle }) {
    const [userName, setUserName] = useState("User");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isMember, setIsMember] = useState(false);

    useEffect(() => {
        const storedName = localStorage.getItem("userName") || "Admin";
        setUserName(storedName);
        const role = (localStorage.getItem("userRole") || "").toLowerCase();
        const memberSession = localStorage.getItem("isMember") === "true" || role === "team_member" || Boolean(localStorage.getItem("memberId"));
        setIsMember(memberSession);
    }, []);

    useEffect(() => {
        if (!dropdownOpen) return;
        const closeDropdown = () => setDropdownOpen(false);
        document.addEventListener("click", closeDropdown);
        return () => document.removeEventListener("click", closeDropdown);
    }, [dropdownOpen]);

    const initials = userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

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
            </div>

            <div className="user-box" style={{ position: "relative" }}>
                <NotificationBell mode={isMember ? "member" : "admin"} />
                <div
                    className="user-profile-trigger"
                    onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen((prev) => !prev);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                >
                    <div className="user-avatar">{initials}</div>
                    <span className="user-name">{userName}</span>
                </div>

                {dropdownOpen && (
                    <div
                        className="user-dropdown"
                        style={{
                            position: "absolute",
                            top: "120%",
                            right: 0,
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "6px",
                            minWidth: "160px",
                            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                            zIndex: 1000,
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                        }}
                    >
                        {isMember ? (
                            <Link
                                href="/dashboard/profile"
                                onClick={() => setDropdownOpen(false)}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "8px 12px",
                                    border: "none",
                                    background: "transparent",
                                    color: "#0f172a",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    borderRadius: "6px",
                                    transition: "background 0.2s",
                                    textDecoration: "none",
                                }}
                            >
                                <User size={16} />
                                <span>Edit Profile</span>
                            </Link>
                        ) : (
                            <Link
                                href="/dashboard/club-profile"
                                onClick={() => setDropdownOpen(false)}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "8px 12px",
                                    border: "none",
                                    background: "transparent",
                                    color: "#0f172a",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    borderRadius: "6px",
                                    transition: "background 0.2s",
                                    textDecoration: "none",
                                }}
                            >
                                <User size={16} />
                                <span>View Profile</span>
                            </Link>
                        )}
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
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: "14px",
                                borderRadius: "6px",
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
