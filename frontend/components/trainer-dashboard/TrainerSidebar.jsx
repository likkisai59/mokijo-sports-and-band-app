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
            },
            {
                href: "/trainer-dashboard/trainings",
                label: "My Trainings",
            },
            {
                href: "/trainer-dashboard/candidates",
                label: "Candidates",
            },
        ],
    },
];

export default function TrainerSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <aside className="vd-sidebar">
            <div className="vd-sidebar-brand">Trainer</div>
            {NAV.map((section) => (
                <div key={section.label} className="vd-nav-section">
                    <div className="vd-nav-label">{section.label}</div>
                    {section.items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`vd-nav-item ${pathname.startsWith(item.href) ? "active" : ""}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            ))}
            <button
                type="button"
                className="vd-nav-item"
                style={{ marginTop: "auto", border: "none", background: "transparent", cursor: "pointer", width: "100%", textAlign: "left" }}
                onClick={() => {
                    localStorage.clear();
                    router.push("/");
                }}
            >
                Logout
            </button>
        </aside>
    );
}
