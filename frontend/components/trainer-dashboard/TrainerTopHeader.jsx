"use client";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import NotificationBell from "../dashboard/NotificationBell";

export default function TrainerTopHeader() {
    const [trainerName, setTrainerName] = useState("Trainer");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        const name = localStorage.getItem("trainerName") || "Trainer";
        setTrainerName(name);
    }, []);

    useEffect(() => {
        if (!dropdownOpen) return;
        const closeDropdown = () => setDropdownOpen(false);
        document.addEventListener("click", closeDropdown);
        return () => document.removeEventListener("click", closeDropdown);
    }, [dropdownOpen]);

    const initials = trainerName
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
        <header className="vd-header">
            <span className="vd-header-logo">MUKIJO</span>
            <span className="vd-header-title">Trainer Dashboard</span>
            <div className="vd-header-right" style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px" }}>
                <NotificationBell mode="empty" />
                <div
                    className="vd-owner-badge"
                    onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen((prev) => !prev);
                    }}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                >
                    <div className="vd-owner-avatar">{initials}</div>
                    <span className="vd-owner-name">{trainerName}</span>
                </div>

                {dropdownOpen && (
                    <div
                        className="vd-owner-dropdown"
                        style={{
                            position: "absolute",
                            top: "120%",
                            right: 0,
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "6px",
                            minWidth: "150px",
                            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                            zIndex: 1000,
                        }}
                    >
                        <button
                            className="vd-logout-btn"
                            onClick={handleLogout}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 12px",
                                border: "1px solid #fecaca",
                                background: "#fef2f2",
                                color: "#dc2626",
                                cursor: "pointer",
                                fontSize: "14px",
                                borderRadius: "6px",
                                fontWeight: "700",
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
