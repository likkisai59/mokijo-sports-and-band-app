"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Groups list page removed — send admins back to overview (create/import live on InfoCard). */
export default function GroupsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/overview");
    }, [router]);

    return null;
}
