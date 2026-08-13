"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Music, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { getBandUser, bandLogout } from "../../lib/bandAuth";

export default function BandNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        setUser(getBandUser());
        setMobileMenuOpen(false); // Close menu on navigation
    }, [pathname]);

    const handleLogout = async () => {
        await bandLogout();
        setUser(null);
        router.push("/band");
    };

    return (
        <header className="band-navbar" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
            <Link href="/band" className="band-navbar__brand">
                <span className="band-navbar__logo">Mukijo</span>
                <span className="band-navbar__tag">Band</span>
            </Link>

            <button 
                className="band-navbar__mobile-toggle md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', display: 'none' }}
                aria-label="Toggle menu"
            >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <nav className={`band-navbar__links ${mobileMenuOpen ? 'band-navbar__links--open' : ''}`}>
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
                        <div className="band-navbar__user" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <div className="band-navbar__avatar" title={user.name} style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #c6ff3d, #d9ff6e)", color: "#08080f", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
                                {(user.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="band-navbar__logout"
                                title="Sign out"
                                style={{ width: "auto" }}
                            >
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                    <LogOut size={14} />
                                    <span className="band-navbar__link-hide md:inline">Logout</span>
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
