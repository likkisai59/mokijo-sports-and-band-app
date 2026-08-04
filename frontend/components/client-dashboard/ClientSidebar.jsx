"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, Calendar, MessageSquare, Bell, CreditCard, Star, Settings, User } from "lucide-react";

const NAV = [
    {
        label: "MAIN",
        items: [
            {
                href: "/band/client/dashboard",
                label: "Dashboard",
                icon: <Home size={18} strokeWidth={2} />,
            },
            {
                href: "/band/client/favorites",
                label: "Favorites",
                icon: <Heart size={18} strokeWidth={2} />,
            },
            {
                href: "/band/client/bookings",
                label: "My Bookings",
                icon: <Calendar size={18} strokeWidth={2} />,
            },
            {
                href: "/band/client/messages",
                label: "Messages",
                icon: <MessageSquare size={18} strokeWidth={2} />,
            },
            {
                href: "/band/client/notifications",
                label: "Notifications",
                icon: <Bell size={18} strokeWidth={2} />,
            },
        ],
    },
    {
        label: "ACCOUNT",
        items: [
            {
                href: "/band/client/payments",
                label: "Payments",
                icon: <CreditCard size={18} strokeWidth={2} />,
            },
            {
                href: "/band/client/reviews",
                label: "My Reviews",
                icon: <Star size={18} strokeWidth={2} />,
            },
            {
                href: "/band/client/profile",
                label: "Profile",
                icon: <User size={18} strokeWidth={2} />,
            },
            {
                href: "/band/client/settings",
                label: "Settings",
                icon: <Settings size={18} strokeWidth={2} />,
            },
        ],
    },
];

export default function ClientSidebar() {
    const pathname = usePathname();

    return (
        <aside className="cd-sidebar">
            {NAV.map((section) => (
                <div key={section.label}>
                    <div className="cd-sidebar-section">{section.label}</div>
                    {section.items.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`cd-nav-item ${pathname === item.href ? "active" : ""}`}
                        >
                            <span className="cd-nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </div>
            ))}
        </aside>
    );
}
