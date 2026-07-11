"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import VenueTopHeader from "../../components/venue-dashboard/VenueTopHeader";
import VenueSidebar from "../../components/venue-dashboard/VenueSidebar";
import "../styles/venue-dashboard.css";

export default function VenueDashboardLayout({ children }) {
    const router = useRouter();

    useEffect(() => {
        const id = localStorage.getItem("venueOwnerId");
        if (!id || id === "undefined" || id === "null") {
            router.replace("/login-venue");
        }
    }, [router]);

    return (
        <div className="vd-root">
            <VenueTopHeader />
            <div className="vd-layout">
                <VenueSidebar />
                <main className="vd-main">
                    {children}
                </main>
            </div>
        </div>
    );
}
