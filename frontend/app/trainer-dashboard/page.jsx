"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TrainerDashboardRoot() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/trainer-dashboard/overview");
    }, [router]);
    return (
        <div className="vd-loading">
            <div className="vd-spinner" />
        </div>
    );
}
