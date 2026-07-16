"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import Link from "next/link";

export default function RegisterDropdown() {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const items = [
        {
            href: "/register",
            title: "As Club Admin",
            desc: "Create your club admin account",
            icon: (
                <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            ),
        },
        {
            href: "/register-member",
            title: "As Club Member",
            desc: "Join your club as a member",
            icon: (
                <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
        {
            href: "/register-venue",
            title: "Register a Venue",
            desc: "List your sports venue on Mukijo",
            icon: (
                <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            ),
        },
        {
            href: "/register-user",
            title: "As User",
            desc: "Create a standard user account",
            icon: (
                <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
            ),
        },
    ];

    return (
        <div className="login-dropdown-wrapper" ref={ref}>
            <button className="topbar-btn topbar-btn--register" onClick={() => setOpen((p) => !p)}>
                Register
            </button>
            {open && (
                <div className="login-dropdown-menu">
                    {items.map((item, i) => (
                        <Fragment key={item.href}>
                            {i > 0 && <div className="dropdown-divider" />}
                            <Link href={item.href} className="login-dropdown-item" onClick={() => setOpen(false)}>
                                <span className="dropdown-item-icon">{item.icon}</span>
                                <div>
                                    <span className="dropdown-item-title">{item.title}</span>
                                    <span className="dropdown-item-desc">{item.desc}</span>
                                </div>
                            </Link>
                        </Fragment>
                    ))}
                </div>
            )}
        </div>
    );
}
