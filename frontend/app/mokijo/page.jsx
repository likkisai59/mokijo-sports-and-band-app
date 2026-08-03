"use client";

import { useState } from "react";
import Link from "next/link";
import HeroSlideshow from "@/components/marketing/HeroSlideshow";
import "./marketing-home.css";

export default function Home() {
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => setMenuOpen(false);

    return (
        <main className="mkt-root min-h-screen flex flex-col overflow-x-hidden relative bg-white text-[#0a0a0f]">
            {/* ── Sticky Nav ── */}
            <header className="fixed top-0 left-0 right-0 z-[1000] h-[72px] bg-white/92 backdrop-blur-md border-b border-[rgba(10,10,15,0.08)]">
                <div className="mkt-container h-full flex items-center justify-between">
                    <a href="#top" className="mkt-brand text-[22px] md:text-[26px] text-[#0a0a0f] no-underline">
                        MUKIJO
                    </a>

                    <nav className="hidden md:flex items-center gap-8 text-[14px] font-semibold text-[#5c5c66]">
                        <a href="#sports" className="hover:text-[#0a0a0f] transition-colors">
                            Sports
                        </a>
                        <a href="#band" className="hover:text-[#0a0a0f] transition-colors">
                            Band
                        </a>
                        <a href="#get-started" className="hover:text-[#0a0a0f] transition-colors">
                            Get started
                        </a>
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <a href="#get-started" className="mkt-btn mkt-btn-secondary">
                            Log in
                        </a>
                        <a href="#get-started" className="mkt-btn mkt-btn-primary">
                            Register
                        </a>
                    </div>

                    <button
                        type="button"
                        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[rgba(10,10,15,0.12)] text-[#0a0a0f] bg-white"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((v) => !v)}
                    >
                        {menuOpen ? (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 7h16M4 12h16M4 17h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </header>

            {menuOpen && (
                <div className="fixed inset-x-0 top-[72px] z-[999] md:hidden bg-white border-b border-[rgba(10,10,15,0.08)] shadow-sm">
                    <div className="mkt-container py-5 flex flex-col gap-4">
                        <a href="#sports" onClick={closeMenu} className="text-[15px] font-semibold text-[#0a0a0f]">
                            Sports
                        </a>
                        <a href="#band" onClick={closeMenu} className="text-[15px] font-semibold text-[#0a0a0f]">
                            Band
                        </a>
                        <a href="#get-started" onClick={closeMenu} className="text-[15px] font-semibold text-[#0a0a0f]">
                            Get started
                        </a>
                        <div className="flex gap-2 pt-2">
                            <a href="#get-started" onClick={closeMenu} className="mkt-btn mkt-btn-secondary mkt-btn-block">
                                Log in
                            </a>
                            <a href="#get-started" onClick={closeMenu} className="mkt-btn mkt-btn-primary mkt-btn-block">
                                Register
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Hero ── */}
            <section id="top" className="mkt-hero relative mt-[72px] min-h-[calc(100vh-72px)] flex items-center overflow-hidden">
                <HeroSlideshow />

                <div className="mkt-container relative z-10 py-16 md:py-24 pb-24">
                    <h1 className="mkt-display mkt-hero-anim text-[28px] sm:text-[36px] md:text-[44px] lg:text-[52px] text-white max-w-xl leading-[1.1] mb-4">
                        Sports and stage. One home.
                    </h1>
                    <p className="mkt-hero-anim-delay text-[15px] md:text-[17px] text-white/80 max-w-md leading-relaxed mb-8">
                        Run clubs, courts, and trainings — or book live music — without juggling five tools.
                    </p>
                    <div className="mkt-hero-anim-delay flex flex-wrap gap-3">
                        <a href="#sports" className="mkt-btn mkt-btn-primary">
                            Explore Sports
                        </a>
                        <a href="#band" className="mkt-btn mkt-btn-band">
                            Explore Band
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Dual platforms ── */}
            <section className="bg-[#f7f7f8] border-y border-[rgba(10,10,15,0.06)] py-20 md:py-28 my-10 md:my-16">
                <div className="mkt-container">
                    <div className="mkt-section-head mb-12 md:mb-16">
                        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#5c5c66]">Dual Platforms</span>
                        <h2 className="mkt-display text-[28px] md:text-[38px] text-[#0a0a0f] mt-2">
                            Choose Your Experience
                        </h2>
                        <p>
                            Whether you're running sports club operations or booking live music performances, Mukijo provides dedicated tools for both.
                        </p>
                    </div>

                    <div className="mkt-platform-grid">
                        {/* Sports Platform Card */}
                        <div id="sports" className="mkt-reveal mkt-platform-card mkt-platform-card-sports scroll-mt-24">
                            <div className="flex items-center gap-3">
                                <span className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#c6ff3d]/15 text-white border border-[#c6ff3d]/30 shrink-0">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                        <path d="M4 22h16" />
                                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                                    </svg>
                                </span>
                                <div>
                                    <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-white">Sports Club</span>
                                    <h2 className="mkt-display text-[24px] md:text-[30px] text-white leading-tight">
                                        Your club. Your court. Your game.
                                    </h2>
                                </div>
                            </div>

                            <p className="text-[15px] md:text-[16px] text-white leading-relaxed">
                                Groups, members, matches, events, fundraising, venues, and trainings — built for admins,
                                players, venue owners, and trainers.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <span className="mkt-chip text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white">
                                    Matches
                                </span>
                                <span className="mkt-chip text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white">
                                    Venues
                                </span>
                                <span className="mkt-chip text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white">
                                    Payments
                                </span>
                                <span className="mkt-chip text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white">
                                    Trainings
                                </span>
                            </div>

                            <div className="mkt-platform-actions mt-auto pt-2">
                                <a href="#get-started" className="mkt-btn mkt-btn-primary">
                                    Get started in Sports
                                </a>
                            </div>
                        </div>

                        {/* Music Band Platform Card */}
                        <div id="band" className="mkt-reveal mkt-platform-card mkt-platform-card-band scroll-mt-24">
                            <div className="flex items-center gap-3">
                                <span className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#ff2e93]/15 text-white border border-[#ff2e93]/30 shrink-0">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 18V5l12-2v13" />
                                        <circle cx="6" cy="18" r="3" />
                                        <circle cx="18" cy="16" r="3" />
                                    </svg>
                                </span>
                                <div>
                                    <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-white">Music Band</span>
                                    <h2 className="mkt-display text-[24px] md:text-[30px] text-white leading-tight">
                                        Where music meets the stage.
                                    </h2>
                                </div>
                            </div>

                            <p className="text-[15px] md:text-[16px] text-white leading-relaxed">
                                Artist profiles, booking requests, venues, and earnings — for bands, performers, and clients
                                who book live.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <span className="mkt-chip text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white">
                                    Bookings
                                </span>
                                <span className="mkt-chip text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white">
                                    Artists
                                </span>
                                <span className="mkt-chip text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white">
                                    Venues
                                </span>
                                <span className="mkt-chip text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white">
                                    Earnings
                                </span>
                            </div>

                            <div className="mkt-platform-actions mt-auto pt-2">
                                <Link href="/band" className="mkt-btn mkt-btn-band">
                                    Open Band
                                </Link>
                                <a href="#get-started" className="mkt-btn mkt-btn-secondary" style={{ background: "rgba(255, 255, 255, 0.12)", color: "#ffffff", borderColor: "rgba(255, 255, 255, 0.22)" }}>
                                    Role entry
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Who it's for ── */}
            <section className="bg-white py-20 md:py-28 my-10 md:my-16 border-y border-[rgba(10,10,15,0.06)]">
                <div className="mkt-container">
                    <div className="mkt-section-head mb-12 md:mb-16">
                        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#5c5c66]">User Ecosystem</span>
                        <h2 className="mkt-display text-[28px] md:text-[38px] text-[#0a0a0f] mt-2">Built for Every Role</h2>
                        <p>Pick how you show up — registration takes you straight into the right flow.</p>
                    </div>
                    <div className="mkt-grid-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { href: "/register", title: "Club Admin", desc: "Run groups, events, and payments.", tag: "Sports Club", type: "sports" },
                            { href: "/register-member", title: "Club Member", desc: "Join your club and stay booked in.", tag: "Sports Club", type: "sports" },
                            { href: "/register-venue", title: "Venue Owner", desc: "List courts and manage slots.", tag: "Sports Club", type: "sports" },
                            { href: "/register-trainer", title: "Trainer", desc: "Publish trainings and enroll athletes.", tag: "Sports Club", type: "sports" },
                            { href: "/register-user", title: "Player / User", desc: "Find venues, games, and courses.", tag: "Sports Club", type: "sports" },
                            { href: "/band/register", title: "Artist / Band", desc: "Get booked for live shows.", tag: "Music Band", type: "band" },
                        ].map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`mkt-role-card ${item.type === "band" ? "mkt-role-card-band" : "mkt-role-card-sports"}`}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${item.type === "band" ? "text-[#ff75c3]" : "text-[#c6ff3d]"}`}>
                                    {item.tag}
                                </span>
                                <span className="text-[17px] font-bold text-white mt-1">{item.title}</span>
                                <span className="text-[13.5px] text-white/75 leading-relaxed">{item.desc}</span>
                                <span className="mkt-role-card-cta font-bold text-[13px] mt-auto pt-2">Register →</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="bg-[#f7f7f8] border-y border-[rgba(10,10,15,0.06)] py-20 md:py-28 my-10 md:my-16">
                <div className="mkt-container">
                    <div className="mkt-section-head mb-14 md:mb-20">
                        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#5c5c66]">Simple & Powerful Workflow</span>
                        <h2 className="mkt-display text-[28px] md:text-[38px] text-[#0a0a0f] mt-2">How Mukijo Works</h2>
                        <p>From setup to full-scale operations — four simple steps to power sports clubs and live band bookings.</p>
                    </div>

                    <div className="mkt-grid-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                        {[
                            {
                                n: "01",
                                badge: "Platform Entry",
                                title: "Select Domain & Role",
                                sub: "Sports Club or Live Music",
                                desc: "Choose between Sports Club management or Music Band booking. Register as a Club Admin, Member, Venue Owner, Trainer, Player, or Artist.",
                                tags: ["Dual Hub", "Tailored Workflows", "1-Click Sign-in"]
                            },
                            {
                                n: "02",
                                badge: "Configuration",
                                title: "Setup & Customize",
                                sub: "Courts, Gigs & Forms",
                                desc: "Admins configure candidate application forms. Venue owners publish time slots. Bands build press kits with audio/video media clips.",
                                tags: ["Custom Forms", "Slot Inventory", "Press Kit"]
                            },
                            {
                                n: "03",
                                badge: "Transactions",
                                title: "Engage & Book",
                                sub: "Real-time & Escrow",
                                desc: "Players join pickup games and pay court fees. Event hosts book live bands directly with automated Razorpay escrow payment protection.",
                                tags: ["Razorpay Escrow", "Instant RSVP", "Verified Ratings"]
                            },
                            {
                                n: "04",
                                badge: "Management",
                                title: "Automate & Scale",
                                sub: "Real-Time Dashboard Control",
                                desc: "Manage rosters, approve candidate applications, track payouts, coordinate match schedules, and view real-time analytics in one place.",
                                tags: ["Live Dashboard", "Auto Payouts", "Analytics"]
                            }
                        ].map((step) => (
                            <div key={step.n} className="mkt-step-card">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="mkt-step-number">{step.n}</span>
                                    <span className="mkt-step-badge">{step.badge}</span>
                                </div>

                                <div>
                                    <h3 className="text-[18px] font-bold text-[#0a0a0f] leading-snug">{step.title}</h3>
                                    <p className="text-[12px] font-semibold text-[#7aab18] mt-0.5">{step.sub}</p>
                                </div>

                                <p className="text-[13.5px] text-[#5c5c66] leading-relaxed mb-2">{step.desc}</p>

                                <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-[rgba(10,10,15,0.06)]">
                                    {step.tags.map((tag) => (
                                        <span key={tag} className="mkt-step-tag">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Get started / role hub ── */}
            <section id="get-started" className="bg-white scroll-mt-24 py-20 md:py-28 my-10 md:my-16">
                <div className="mkt-container">
                    <div className="mkt-section-head mb-12 md:mb-16">
                        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#5c5c66]">Instant Access</span>
                        <h2 className="mkt-display text-[28px] md:text-[38px] text-[#0a0a0f] mt-2">Get Started</h2>
                        <p>Log in or register with the role that matches how you use Mukijo.</p>
                    </div>

                    <div className="mkt-grid-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
                        {/* Sports role hub */}
                        <div className="mkt-panel">
                            <div className="flex items-center gap-3">
                                <span className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#c6ff3d]/30 text-[#0a0a0f] border border-[#c6ff3d]/45 shrink-0">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                        <path d="M4 22h16" />
                                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                                    </svg>
                                </span>
                                <div>
                                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#9fcc1f]">Sports Club</p>
                                    <h3 className="text-[20px] font-bold text-[#0a0a0f]">Sports platform</h3>
                                </div>
                            </div>

                            <div>
                                <div className="mkt-section-label">Login As</div>
                                <div className="mkt-role-grid">
                                    <Link href="/login" className="mkt-btn mkt-btn-role mkt-btn-role-primary">
                                        Club Admin
                                    </Link>
                                    <Link href="/super-admin/login" className="mkt-btn mkt-btn-role">
                                        Super Admin
                                    </Link>
                                    <Link href="/login-member" className="mkt-btn mkt-btn-role">
                                        Member
                                    </Link>
                                    <Link href="/login-venue" className="mkt-btn mkt-btn-role">
                                        Venue Owner
                                    </Link>
                                    <Link href="/login-user" className="mkt-btn mkt-btn-role">
                                        User
                                    </Link>
                                    <Link href="/login-trainer" className="mkt-btn mkt-btn-role">
                                        Trainer
                                    </Link>
                                </div>
                            </div>

                            <div className="mkt-divider">or</div>

                            <div>
                                <div className="mkt-section-label">Register As</div>
                                <div className="mkt-role-grid">
                                    <Link href="/register" className="mkt-btn mkt-btn-role mkt-btn-role-primary-soft">
                                        Club Admin
                                    </Link>
                                    <Link href="/register-member" className="mkt-btn mkt-btn-role">
                                        Member
                                    </Link>
                                    <Link href="/register-venue" className="mkt-btn mkt-btn-role">
                                        Venue Owner
                                    </Link>
                                    <Link href="/register-user" className="mkt-btn mkt-btn-role">
                                        User
                                    </Link>
                                    <Link href="/register-trainer" className="mkt-btn mkt-btn-role">
                                        Trainer
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Band role hub */}
                        <div className="mkt-panel">
                            <div className="flex items-center gap-3">
                                <span className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#ff2e93]/12 text-[#ff2e93] border border-[#ff2e93]/25 shrink-0">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 18V5l12-2v13" />
                                        <circle cx="6" cy="18" r="3" />
                                        <circle cx="18" cy="16" r="3" />
                                    </svg>
                                </span>
                                <div>
                                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#ff2e93]">Music Band</p>
                                    <h3 className="text-[20px] font-bold text-[#0a0a0f]">Band platform</h3>
                                </div>
                            </div>

                            <div>
                                <div className="mkt-section-label">Login As</div>
                                <div className="mkt-role-grid">
                                    <Link href="/band/login" className="mkt-btn mkt-btn-role mkt-btn-role-band">
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M9 18V5l12-2v13" />
                                            <circle cx="6" cy="18" r="3" />
                                            <circle cx="18" cy="16" r="3" />
                                        </svg>
                                        Band Admin / Artist
                                    </Link>
                                </div>
                                <p className="text-[12px] leading-relaxed text-[#5c5c66] mt-2.5">
                                    Access the band dashboard for scheduling and booking coordination.
                                </p>
                            </div>

                            <div className="mkt-divider">or</div>

                            <div>
                                <div className="mkt-section-label">Register As</div>
                                <div className="mkt-role-grid">
                                    <Link href="/band/register" className="mkt-btn mkt-btn-role mkt-btn-role-band-outline">
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M9 18V5l12-2v13" />
                                            <circle cx="6" cy="18" r="3" />
                                            <circle cx="18" cy="16" r="3" />
                                        </svg>
                                        Band Admin / Artist
                                    </Link>
                                </div>
                                <p className="text-[12px] leading-relaxed text-[#5c5c66] mt-2.5">
                                    Create a band or artist account to publish profiles and accept bookings.
                                </p>
                            </div>

                            <Link href="/band" className="text-[13px] font-bold text-[#ff2e93] hover:underline w-fit mt-auto">
                                Visit Band landing →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-[rgba(10,10,15,0.08)] bg-white">
                <div className="mkt-container h-16 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#5c5c66]">
                    <div className="flex items-center gap-2">
                        <span className="mkt-brand text-[14px] text-[#0a0a0f]">MUKIJO</span>
                        <span>© 2026. All rights reserved.</span>
                    </div>
                    <div className="flex gap-4">
                        <a href="#sports" className="hover:text-[#0a0a0f] transition-colors">
                            Sports
                        </a>
                        <a href="#band" className="hover:text-[#0a0a0f] transition-colors">
                            Band
                        </a>
                        <a href="#get-started" className="hover:text-[#0a0a0f] transition-colors">
                            Get started
                        </a>
                    </div>
                </div>
            </footer>
        </main>
    );
}
