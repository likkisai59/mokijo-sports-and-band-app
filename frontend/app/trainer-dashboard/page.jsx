"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TrainerDashboardIndex() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/trainer-dashboard/overview");
    }, [router]);
    return null;
}
