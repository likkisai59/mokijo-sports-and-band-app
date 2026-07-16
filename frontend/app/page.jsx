import { Zap, Trophy, Calendar, CreditCard, BarChart3 } from "lucide-react";
import LoginDropdown from "../components/LoginDropdown";
import RegisterDropdown from "../components/RegisterDropdown";
import "./styles/landing.css";

const FEATURES = [
    { icon: <Trophy size={13} />, label: "Group Management" },
    { icon: <Calendar size={13} />, label: "Event Scheduling" },
    { icon: <CreditCard size={13} />, label: "Payment Tracking" },
    { icon: <BarChart3 size={13} />, label: "Analytics" },
    { icon: <Zap size={13} />, label: "Real-time Updates" },
];

export default function Home() {
    return (
        <main className="landing-page">
            {/* ── Top Navigation ── */}
            <header className="landing-topbar">
                <strong className="logo">Mukijo</strong>
                <div className="topbar-nav">
                    <LoginDropdown />
                    <RegisterDropdown />
                </div>
            </header>

            {/* ── Hero Section ── */}
            <section className="landing-hero">
                {/* Floating orbs */}
                <div className="orb orb-1" aria-hidden="true" />
                <div className="orb orb-2" aria-hidden="true" />
                <div className="orb orb-3" aria-hidden="true" />

                {/* Badge */}
                <div className="hero-badge">Club Management Platform</div>

                {/* Headline */}
                <h1 className="hero-headline">
                    <span className="line-1">Your Club,</span>
                    <span className="line-2">Supercharged.</span>
                </h1>

                {/* Subheadline */}
                <p className="hero-sub">
                    Mukijo brings together admins, coaches, players, parents, and referees into one powerful platform —
                    beautiful by design, powerful by nature.
                </p>

                {/* Feature pills */}
                <div className="hero-features">
                    {FEATURES.map((f) => (
                        <div key={f.label} className="feat-pill">
                            {f.icon}
                            {f.label}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="landing-footer">
                <span>©</span>
                <span>2026 Mukijo Club.</span>
                All rights reserved.
            </footer>
        </main>
    );
}
