"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    CalendarCheck, 
    MessageSquare, 
    Bell, 
    Users, 
    Music, 
    MapPin, 
    Settings, 
    Star 
} from "lucide-react";

const NAV = [
    {
        label: "MAIN",
        items: [
            {
                href: "/band/admin/dashboard",
                label: "Dashboard",
                icon: <LayoutDashboard size={18} strokeWidth={2} />,
            },
            {
                href: "/band/admin/bookings",
                label: "Bookings & Timeline",
                icon: <CalendarCheck size={18} strokeWidth={2} />,
            },
            {
                href: "/band/admin/messages",
                label: "Disputes & Messages",
                icon: <MessageSquare size={18} strokeWidth={2} />,
            },
            {
                href: "/band/admin/notifications",
                label: "Broadcasts",
                icon: <Bell size={18} strokeWidth={2} />,
            },
        ],
    },
    {
        label: "VERIFICATION & MANAGEMENT",
        items: [
            {
                href: "/band/admin/users",
                label: "Users",
                icon: <Users size={18} strokeWidth={2} />,
            },
            {
                href: "/band/admin/artists",
                label: "Artists",
                icon: <Music size={18} strokeWidth={2} />,
            },
            {
                href: "/band/admin/venues",
                label: "Venues",
                icon: <MapPin size={18} strokeWidth={2} />,
            },
            {
                href: "/band/admin/reviews",
                label: "Review Moderation",
                icon: <Star size={18} strokeWidth={2} />,
            },
        ],
    },
    {
        label: "PLATFORM CONFIG",
        items: [
            {
                href: "/band/admin/settings",
                label: "Settings",
                icon: <Settings size={18} strokeWidth={2} />,
            },
        ],
    },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="ad-sidebar">
            {NAV.map((section) => (
                <div key={section.label}>
                    <div className="ad-sidebar-section">{section.label}</div>
                    {section.items.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`ad-nav-item ${pathname === item.href ? "active" : ""}`}
                        >
                            <span className="ad-nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </div>
            ))}
        </aside>
    );
}
