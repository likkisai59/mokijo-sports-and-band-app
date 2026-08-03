"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TrainerTopHeader from "@/components/trainer-dashboard/TrainerTopHeader";
import TrainerSidebar from "@/components/trainer-dashboard/TrainerSidebar";
import "@/app/styles/venue-dashboard.css";

export default function TrainerDashboardLayout({ children }) {
    const router = useRouter();

    useEffect(() => {
        const id = localStorage.getItem("trainerId");
        const token = localStorage.getItem("accessToken") || localStorage.getItem("access_token");
        const isValidId = id && id !== "undefined" && id !== "null";
        const isValidToken = token && token !== "undefined" && token !== "null";
        if (!isValidId || !isValidToken) {
            router.replace("/login-trainer");
        }
    }, [router]);

    return (
        <div className="vd-root">
            <TrainerTopHeader />
            <div className="vd-layout">
                <TrainerSidebar />
                <main className="vd-main">{children}</main>
            </div>
        </div>
    );
}
