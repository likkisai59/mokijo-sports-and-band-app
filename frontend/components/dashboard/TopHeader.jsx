"use client";
import { useEffect, useState } from "react";
import { Menu, X, LogOut } from "lucide-react";

export default function TopHeader({ isMobileMenuOpen = false, onMenuToggle }) {
    const [userName, setUserName] = useState("User");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        const storedName = localStorage.getItem("userName") || "Admin";
        setUserName(storedName);
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
                <strong className="logo">Mukijo</strong>
            </div>

            <div className="user-box" style={{ position: "relative" }}>
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
                            backgroundColor: "#0f0f1a",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "8px",
                            padding: "6px",
                            minWidth: "140px",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                            zIndex: 1000,
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
                                color: "#ffffff",
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
