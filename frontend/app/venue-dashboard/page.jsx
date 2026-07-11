"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VenueDashboardRoot() {
    const router = useRouter();
    useEffect(() => { router.replace("/venue-dashboard/overview"); }, [router]);
    return <div className="vd-loading"><div className="vd-spinner" /></div>;
}
