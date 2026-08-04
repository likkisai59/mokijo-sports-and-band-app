"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import NotificationBell from "../dashboard/NotificationBell";
import { getBandUser } from "@/lib/bandAuth";

export default function ClientTopHeader() {
    const [clientName, setClientName] = useState("Client");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const user = getBandUser();
        if (user && user.name) {
            setClientName(user.name);
        }
    }, []);

    useEffect(() => {
        if (!dropdownOpen) return;
        const closeDropdown = () => setDropdownOpen(false);
        document.addEventListener("click", closeDropdown);
        return () => document.removeEventListener("click", closeDropdown);
    }, [dropdownOpen]);

    const initials = clientName
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
        <header className="cd-header">
            <span className="cd-header-logo">Mukijo</span>
            <span className="cd-header-title">Client Portal</span>
            <div className="cd-header-right" style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px" }}>
                <NotificationBell mode="client" />
                <div
                    className="cd-owner-badge"
                    onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen((prev) => !prev);
                    }}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                >
                    <div className="cd-owner-avatar">{initials}</div>
                    <span className="cd-owner-name">{clientName}</span>
                </div>

                {dropdownOpen && (
                    <div
                        className="cd-owner-dropdown"
                        style={{
                            position: "absolute",
                            top: "120%",
                            right: 0,
                            backgroundColor: "#161624",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "8px",
                            padding: "6px",
                            minWidth: "140px",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                            zIndex: 1000,
                        }}
                    >
                        <button
                            className="cd-logout-btn"
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
