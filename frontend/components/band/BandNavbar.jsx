"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Music, LogOut, LayoutDashboard } from "lucide-react";
import { getBandUser, bandLogout } from "../../lib/bandAuth";

export default function BandNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setUser(getBandUser());
    }, [pathname]);

    const handleLogout = async () => {
        await bandLogout();
        setUser(null);
        router.push("/band");
    };

    return (
        <header className="band-navbar">
            <Link href="/band" className="band-navbar__brand">
                <span className="band-navbar__logo">Mukijo</span>
                <span className="band-navbar__tag">Band</span>
            </Link>

            <nav className="band-navbar__links">
                <Link href="/band" className="band-navbar__link">
                    Explore
                </Link>
                <Link href="/band/artists" className="band-navbar__link">
                    Artists
                </Link>
                <Link href="/band/venues" className="band-navbar__link">
                    Venues
                </Link>

                {mounted && user ? (
                    <>
                        <Link href="/band/dashboard" className="band-navbar__link">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <LayoutDashboard size={14} />
                                Dashboard
                            </span>
                        </Link>
                        <div className="band-navbar__user">
                            <div className="band-navbar__avatar" title={user.name}>
                                {(user.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="band-navbar__logout"
                                title="Sign out"
                            >
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                    <LogOut size={14} />
                                    <span className="band-navbar__link-hide">Logout</span>
                                </span>
                            </button>
                        </div>
                    </>
                ) : mounted ? (
                    <>
                        <Link href="/band/login" className="band-navbar__link">
                            Login
                        </Link>
                        <Link href="/band/register" className="band-navbar__link band-navbar__link--accent">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <Music size={14} />
                                Get Started
                            </span>
                        </Link>
                    </>
                ) : null}
            </nav>
        </header>
    );
}
