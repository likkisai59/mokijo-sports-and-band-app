"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CalendarDays, HandCoins, LayoutDashboard, Users } from "lucide-react";

const defaultNavItems = [
    {
        href: "/dashboard/overview",
        label: "Home",
        icon: LayoutDashboard,
        match: (path) => path === "/dashboard/overview",
    },
    {
        href: "/dashboard/members",
        label: "Team Members",
        icon: Users,
        match: (path) => path.startsWith("/dashboard/members"),
    },
    {
        href: "/dashboard/events",
        label: "Events",
        icon: CalendarDays,
        match: (path) => path.startsWith("/dashboard/events"),
    },
    {
        href: "/dashboard/fundraising",
        label: "Funds",
        icon: HandCoins,
        match: (path) => path.startsWith("/dashboard/fundraising"),
    },
];

const refereeNavItems = [
    {
        href: "/dashboard/overview",
        label: "Home",
        icon: LayoutDashboard,
        match: (path) => path === "/dashboard/overview",
    },
    {
        href: "/dashboard/matches",
        label: "Live Matches",
        icon: Activity,
        match: (path) => path.startsWith("/dashboard/matches"),
    },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const [isReferee, setIsReferee] = useState(false);

    useEffect(() => {
        const isMember = localStorage.getItem("isMember") === "true";
        const memberRole = (localStorage.getItem("memberRole") || "").toLowerCase().trim();
        setIsReferee(isMember && memberRole === "referee");
    }, []);

    const navItems = isReferee ? refereeNavItems : defaultNavItems;

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
