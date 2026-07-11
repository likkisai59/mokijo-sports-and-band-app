"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VenueTopHeader() {
    const [ownerName, setOwnerName] = useState("Venue Owner");
    const router = useRouter();

    useEffect(() => {
        const name = localStorage.getItem("venueOwnerName") || "Venue Owner";
        setOwnerName(name);
    }, []);

    const initials = ownerName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    const handleLogout = () => {
        localStorage.removeItem("venueOwnerId");
        localStorage.removeItem("venueOwnerName");
        localStorage.removeItem("isVenueOwner");
        router.push("/login-venue");
    };

    return (
        <header className="vd-header">
            <span className="vd-header-logo">Mukijo</span>
            <span className="vd-header-title">Venue Partner Dashboard</span>
            <div className="vd-header-right">
                <div className="vd-owner-badge">
                    <div className="vd-owner-avatar">{initials}</div>
                    <span className="vd-owner-name">{ownerName}</span>
                </div>
                <button className="vd-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
        </header>
    );
}
