"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import NotificationBell from "../dashboard/NotificationBell";

export default function VenueTopHeader() {
    const [ownerName, setOwnerName] = useState("Venue Owner");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const name = localStorage.getItem("venueOwnerName") || "Venue Owner";
        setOwnerName(name);
    }, []);

    useEffect(() => {
        if (!dropdownOpen) return;
        const closeDropdown = () => setDropdownOpen(false);
        document.addEventListener("click", closeDropdown);
        return () => document.removeEventListener("click", closeDropdown);
    }, [dropdownOpen]);

    const initials = ownerName
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
            <span className="vd-header-logo">Mukijo</span>
            <span className="vd-header-title">Venue Partner Dashboard</span>
            <div className="vd-header-right" style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px" }}>
                <NotificationBell mode="venue" bookingsHref="/venue-dashboard/bookings" />
                <div
                    className="vd-owner-badge"
                    onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen((prev) => !prev);
                    }}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                >
                    <div className="vd-owner-avatar">{initials}</div>
                    <span className="vd-owner-name">{ownerName}</span>
                </div>

                {dropdownOpen && (
                    <div
                        className="vd-owner-dropdown"
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
                            className="vd-logout-btn"
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
