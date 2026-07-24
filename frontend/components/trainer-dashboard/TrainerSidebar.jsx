"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
    {
        label: "MAIN",
        items: [
            {
                href: "/trainer-dashboard/overview",
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
                href: "/trainer-dashboard/trainings",
                label: "Trainings",
                icon: (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                ),
            },
        ],
    },
];

export default function TrainerSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("trainerId");
        localStorage.removeItem("trainerName");
        localStorage.removeItem("isTrainer");
        localStorage.removeItem("userRole");
        localStorage.removeItem("accessToken");
        router.push("/login-trainer");
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
