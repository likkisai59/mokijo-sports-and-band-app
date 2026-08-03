"use client";

import Link from "next/link";
import { Mic, Building2, CalendarCheck, Wallet, Star, ArrowRight } from "lucide-react";
import { isBandAuthenticated } from "@/lib/bandAuth";

const STEPS = [
    { icon: <Mic size={18} />, title: "Create your profile", desc: "Artists, bands & venues list themselves in minutes." },
    { icon: <CalendarCheck size={18} />, title: "Get booked", desc: "Receive booking requests, negotiate, and confirm." },
    { icon: <Wallet size={18} />, title: "Get paid", desc: "Track earnings, wallet balance, and payouts." },
];

const AUDIENCE = [
    {
        icon: <Mic size={20} />,
        title: "For Artists & Bands",
        desc: "Showcase your sound, set your rates, and fill your calendar.",
        href: "/band/register",
        cta: "Join as Artist",
    },
    {
        icon: <Building2 size={20} />,
        title: "For Venues",
        desc: "List your event space and connect with performers and clients.",
        href: "/band/register",
        cta: "List your Venue",
    },
    {
        icon: <Star size={20} />,
        title: "For Clients",
        desc: "Find and book the perfect artist or venue for your event.",
        href: "/band/register",
        cta: "Start Booking",
    },
];

export default function BandLandingPage() {
    const authed = typeof window !== "undefined" && isBandAuthenticated();

    return (
        <>
            <section className="band-hero">
                <div className="band-hero__badge">Live Music Marketplace</div>
                <h1 className="band-hero__title">
                    <span>Where Music</span>
                    <br />
                    <span className="grad">Meets the Stage.</span>
                </h1>
                <p className="band-hero__sub">
                    Book talented artists and bands, discover stunning venues, and manage every gig — all in one place.
                </p>
                <div className="band-hero__cta">
                    <Link href={authed ? "/band/dashboard" : "/band/register"} className="band-btn band-btn--primary">
                        Get Started <ArrowRight size={16} />
                    </Link>
                    <Link href="/band/login" className="band-btn band-btn--ghost">
                        I have an account
                    </Link>
                </div>
            </section>

            <section className="band-section">
                <div className="band-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                    {AUDIENCE.map((a) => (
                        <div key={a.title} className="band-card" style={{ cursor: "default" }}>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "rgba(198, 255, 61, 0.12)",
                                    color: "#c6ff3d",
                                }}
                            >
                                {a.icon}
                            </div>
                            <h3 className="band-card__title">{a.title}</h3>
                            <p style={{ color: "rgba(244, 244, 245,0.55)", fontSize: 14, lineHeight: 1.6 }}>{a.desc}</p>
                            <Link href={a.href} className="band-btn band-btn--cyan" style={{ alignSelf: "flex-start", marginTop: 4 }}>
                                {a.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            <section className="band-section" style={{ paddingTop: 0 }}>
                <div className="band-section__head">
                    <h2 className="band-section__title">How it works</h2>
                </div>
                <div className="band-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                    {STEPS.map((s, i) => (
                        <div key={s.title} className="band-card" style={{ cursor: "default" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    color: "#c6ff3d",
                                    fontWeight: 800,
                                }}
                            >
                                <span style={{ opacity: 0.4 }}>0{i + 1}</span>
                                {s.icon}
                            </div>
                            <h3 className="band-card__title">{s.title}</h3>
                            <p style={{ color: "rgba(244, 244, 245,0.55)", fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}
