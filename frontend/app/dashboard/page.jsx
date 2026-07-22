"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Club landing redirects to overview (InfoCard lives on Club Overview). */
export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/overview");
    }, [router]);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
            <p style={{ color: "#64748b", fontWeight: 600 }}>Opening club overview...</p>
        </div>
    );
}
