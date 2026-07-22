"use client";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import NotificationBell from "../dashboard/NotificationBell";

export default function TrainerTopHeader() {
    const [trainerName, setTrainerName] = useState("Trainer");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        setTrainerName(localStorage.getItem("trainerName") || "Trainer");
    }, []);

    useEffect(() => {
        if (!dropdownOpen) return;
        const close = () => setDropdownOpen(false);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, [dropdownOpen]);

    const initials = trainerName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <header className="vd-header">
            <span className="vd-header-logo">Mukijo</span>
            <span className="vd-header-title">Trainer Dashboard</span>
            <div
                className="vd-header-right"
                style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px" }}
            >
                <NotificationBell mode="trainer" candidatesHref="/trainer-dashboard/candidates" />
                <div
                    className="vd-owner-badge"
                    onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen((p) => !p);
                    }}
                    style={{ cursor: "pointer" }}
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
                            backgroundColor: "#161624",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "8px",
                            padding: "6px",
                            minWidth: "140px",
                            zIndex: 1000,
                        }}
                    >
                        <button
                            className="vd-logout-btn"
                            onClick={() => {
                                localStorage.clear();
                                window.location.href = "/";
                            }}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 12px",
                                border: "none",
                                background: "transparent",
                                color: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
