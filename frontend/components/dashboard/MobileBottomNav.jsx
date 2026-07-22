"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, HandCoins, LayoutDashboard, Users } from "lucide-react";

const ALL_NAV_ITEMS = [
    {
        href: "/dashboard/overview",
        label: "Overview",
        icon: LayoutDashboard,
        match: (path) => path === "/dashboard/overview",
        adminOnly: false,
        memberHidden: true, // TASK-021: hide Home/Overview tab for members
    },
    {
        href: "/dashboard/members",
        label: "Team Members",
        icon: Users,
        match: (path) => path.startsWith("/dashboard/members"),
        adminOnly: true,
    },
    {
        href: "/dashboard/events",
        label: "Events",
        icon: CalendarDays,
        match: (path) => path.startsWith("/dashboard/events"),
        adminOnly: false,
    },
    {
        href: "/dashboard/fundraising",
        label: "Funds",
        icon: HandCoins,
        match: (path) => path.startsWith("/dashboard/fundraising"),
        adminOnly: false,
    },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const [isMember, setIsMember] = useState(false);

    useEffect(() => {
        const role = (localStorage.getItem("userRole") || "").toLowerCase();
        setIsMember(localStorage.getItem("isMember") === "true" || role === "team_member");
    }, []);

    const navItems = useMemo(() => {
        return ALL_NAV_ITEMS.filter((item) => {
            if (isMember) {
                if (item.adminOnly) return false;
                if (item.memberHidden) return false;
                return true;
            }
            return true;
        });
    }, [isMember]);

    return (
        <nav className="mobile-bottom-nav" aria-label="Main mobile navigation">
            {navItems.map(({ href, label, icon: Icon, match }) => {
                const isActive = match(pathname);
                return (
                    <Link key={href} href={href} className={`mobile-bottom-item ${isActive ? "active" : ""}`}>
                        <Icon size={20} strokeWidth={2.2} />
                        <span>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
