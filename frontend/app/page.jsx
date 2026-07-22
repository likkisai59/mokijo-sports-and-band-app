import Link from "next/link";
import "./styles/landing.css";

export default function Home() {
    return (
        <main className="landing-page">
            {/* ── Top Navigation ── */}
            <header className="landing-topbar">
                <strong className="logo">MUKIJO</strong>
                <div className="platform-hint">
                    <span className="platform-hint__dot" />
                    <span className="platform-hint__text">Choose your platform</span>
                </div>
            </header>

            {/* ── Two App Panels ── */}
            <section className="app-panels">
                {/* ── Visual Transition Center Divider ── */}
                <div className="app-panels__divider" aria-hidden="true" />

                {/* ── Sports Club App Panel ── */}
                <div className="panel panel--sports">
                    <div className="panel__glow panel__glow--sports" aria-hidden="true" />

                    <div className="panel-card panel-card--sports">
                        <div className="panel-card__content">
                            <div className="panel__top">
                                <div className="panel__icon panel__icon--sports">
                                    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                        <path d="M4 22h16" />
                                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                                    </svg>
                                </div>
                                <span className="panel__label panel__label--sports">Sports Club</span>
                            </div>

                            <h2 className="panel__title">Sports Club Platform</h2>
                            <p className="panel__desc">
                                Manage your club, members, matches, events & payments.
                                Built for admins, coaches, players, and venue owners.
                            </p>

                            <div className="panel__tags">
                                <span className="ptag">Group Management</span>
                                <span className="ptag">Match Scheduling</span>
                                <span className="ptag">Payments</span>
                                <span className="ptag">Venues</span>
                            </div>
                        </div>

                        <div className="panel-card__auth">
                            <div className="auth-group">
                                <div className="auth-group__label">
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                                    Login As
                                </div>
                                <div className="auth-links">
                                    <Link href="/login" className="auth-btn auth-btn--login-primary">Club Admin</Link>
                                    <Link href="/login-member" className="auth-btn auth-btn--login">Member</Link>
                                    <Link href="/login-venue" className="auth-btn auth-btn--login">Venue Owner</Link>
                                    <Link href="/login-user" className="auth-btn auth-btn--login">User</Link>
                                </div>
                            </div>

                            <div className="auth-sep">
                                <span>or</span>
                            </div>

                            <div className="auth-group">
                                <div className="auth-group__label">
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                                    Register As
                                </div>
                                <div className="auth-links">
                                    <Link href="/register" className="auth-btn auth-btn--reg-primary">Club Admin</Link>
                                    <Link href="/register-member" className="auth-btn auth-btn--reg">Member</Link>
                                    <Link href="/register-venue" className="auth-btn auth-btn--reg">Venue Owner</Link>
                                    <Link href="/register-user" className="auth-btn auth-btn--reg">User</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Band App Panel ── */}
                <div className="panel panel--band">
                    <div className="panel__glow panel__glow--band" aria-hidden="true" />
                    
                    <div className="panel-card panel-card--band">
                        <div className="panel-card__new-badge">
                            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            NEW
                        </div>

                        <div className="panel-card__content">
                            <div className="panel__top">
                                <div className="panel__icon panel__icon--band">
                                    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 18V5l12-2v13" />
                                        <circle cx="6" cy="18" r="3" />
                                        <circle cx="18" cy="16" r="3" />
                                    </svg>
                                </div>
                                <span className="panel__label panel__label--band">Music Band</span>
                            </div>

                            <h2 className="panel__title">Music Band Platform</h2>
                            <p className="panel__desc">
                                Book performances, manage artists, venues & earnings.
                                For band admins, artists & venue partners.
                            </p>

                            <div className="panel__tags">
                                <span className="ptag ptag--band">Bookings</span>
                                <span className="ptag ptag--band">Artists</span>
                                <span className="ptag ptag--band">Venues</span>
                                <span className="ptag ptag--band">Earnings</span>
                            </div>
                        </div>

                        <div className="panel-card__auth">
                            <div className="auth-group">
                                <div className="auth-group__label">
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                                    Login As
                                </div>
                                <div className="auth-links">
                                    <Link href="/band/login" className="auth-btn auth-btn--band-login">
                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                                        Band Admin / Artist
                                    </Link>
                                </div>
                                <span className="auth-group__help">Access the band management dashboard for scheduling and booking coordination.</span>
                            </div>

                            <div className="auth-sep">
                                <span>or</span>
                            </div>

                            <div className="auth-group">
                                <div className="auth-group__label">
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                                    Register As
                                </div>
                                <div className="auth-links">
                                    <Link href="/band/register" className="auth-btn auth-btn--band-reg">
                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                                        Band Admin / Artist
                                    </Link>
                                </div>
                                <span className="auth-group__help">Create a new band or artist account to publish profiles and accept event bookings.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="landing-footer">
                <span>©</span>
                <span>2026 MUKIJO.</span>
                All rights reserved.
            </footer>
        </main>
    );
}
