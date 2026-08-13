"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/overview");
    }, [router]);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
            <div style={{ textAlign: "center", color: "#64748b" }}>
                <div
                    style={{
                        width: "40px",
                        height: "40px",
                        border: "4px solid #e2e8f0",
                        borderTopColor: "#10b981",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 16px",
                    }}
                ></div>
                <p style={{ fontWeight: 600, fontFamily: "Outfit, sans-serif" }}>Loading Club Dashboard...</p>
            </div>
            <style jsx>{`
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}

