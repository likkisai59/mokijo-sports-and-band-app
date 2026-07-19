"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
    {
        label: "MAIN",
        items: [
            {
                href: "/venue-dashboard/overview",
                label: "Home",
                icon: (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                ),
            },
            {
                href: "/venue-dashboard/my-venues",
                label: "My Venues",
                icon: (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                ),
            },
            {
                href: "/venue-dashboard/my-venues",
                label: "Verification Status",
                icon: (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                ),
            },
            {
                href: "/venue-dashboard/bookings",
                label: "Bookings",
                icon: (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                ),
            },
            {
                href: "/venue-dashboard/slots",
                label: "Slots & Availability",
                icon: (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                ),
            },
            {
                href: "/venue-dashboard/payouts",
                label: "Payouts",
                icon: (
                    <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M6 9h12M6 5h12M6 5c8.3 0 8.3 8 0 8M12 13L6 21" />
                    </svg>
                ),
            },
        ],
    },
];

export default function VenueSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("venueOwnerId");
        localStorage.removeItem("venueOwnerName");
        localStorage.removeItem("isVenueOwner");
        router.push("/login-venue");
    };

    return (
        <aside className="vd-sidebar">
            {NAV.map((section) => (
                <div key={section.label}>
                    <div className="vd-sidebar-section">{section.label}</div>
                    {section.items.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`vd-nav-item ${pathname === item.href ? "active" : ""}`}
                        >
                            <span className="vd-nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </div>
            ))}

            <div style={{ marginTop: "auto", paddingTop: 24 }}>
                <button
                    className="vd-nav-item"
                    style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer" }}
                    onClick={handleLogout}
                >
                    <span className="vd-nav-icon">
                        <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </span>
                    Logout
                </button>
            </div>
        </aside>
    );
}
