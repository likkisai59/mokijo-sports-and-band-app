import Link from "next/link";

export default function Home() {
    return (
        <main className="min-h-screen flex flex-col bg-[#08080f] text-[#f4f4f5] font-sans overflow-x-hidden relative">
            {/* ── Animated Blur Glow Orbs (Volt + Magenta) ── */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_10%,rgba(198,255,61,0.10)_0%,transparent_60%),radial-gradient(ellipse_60%_80%_at_80%_80%,rgba(255,46,147,0.10)_0%,transparent_60%),radial-gradient(ellipse_40%_40%_at_60%_20%,rgba(217,255,110,0.06)_0%,transparent_50%),radial-gradient(ellipse_50%_50%_at_10%_90%,rgba(255,102,184,0.06)_0%,transparent_50%)] pointer-events-none z-0" aria-hidden="true" />
            
            {/* ── Grid Pattern Overlay ── */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" aria-hidden="true" />

            {/* ── Top Navigation ── */}
            <header className="fixed top-0 left-0 right-0 h-[72px] flex items-center justify-between px-6 md:px-12 bg-[#08080f]/85 backdrop-blur-[20px] border-b border-white/8 z-[1000]">
                <strong className="text-[26px] font-black italic uppercase tracking-wider text-[#f4f4f5]">MUKIJO</strong>
                <div className="flex items-center gap-2 text-[13px] font-medium bg-white/4 border border-white/8 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c6ff3d] shadow-[0_0_8px_#c6ff3d] animate-pulse" />
                    <span className="text-white/70">Choose your platform</span>
                </div>
            </header>

            {/* ── Two App Panels ── */}
            <section className="flex flex-col lg:flex-row flex-1 mt-[72px] relative z-10 min-h-[calc(100vh-72px-56px)]">
                {/* ── Visual Transition Center Divider ── */}
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-white/8 to-white/2 z-50 pointer-events-none" aria-hidden="true" />

                {/* ── Sports Club App Panel ── */}
                <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 relative overflow-hidden group border-b lg:border-b-0 lg:border-r border-white/3">
                    <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-15 bg-[#c6ff3d] -top-[100px] -left-[100px] pointer-events-none z-0" aria-hidden="true" />

                    <div className="w-full max-w-[520px] bg-[#0e0e19]/45 border border-white/5 rounded-[24px] p-8 lg:p-10 flex flex-col gap-8 backdrop-blur-[10px] z-10 transition-all duration-400 hover:border-white/10 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                        <div className="flex flex-col gap-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 bg-[#c6ff3d]/8 border border-[#c6ff3d]/20 text-[#c6ff3d] group-hover:scale-110">
                                    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                        <path d="M4 22h16" />
                                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold uppercase tracking-[2px] text-[#c6ff3d]">Sports Club</span>
                            </div>

                            <h2 className="text-3xl font-extrabold tracking-[-0.5px] text-white">Sports Club Platform</h2>
                            <p className="text-[15px] leading-relaxed text-white/60">
                                Manage your club, members, matches, events & payments.
                                Built for admins, coaches, players, and venue owners.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <span className="text-[12px] font-semibold bg-white/3 border border-white/6 text-white/80 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/5 hover:border-[#c6ff3d]/30 hover:text-[#c6ff3d]">Group Management</span>
                                <span className="text-[12px] font-semibold bg-white/3 border border-white/6 text-white/80 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/5 hover:border-[#c6ff3d]/30 hover:text-[#c6ff3d]">Match Scheduling</span>
                                <span className="text-[12px] font-semibold bg-white/3 border border-white/6 text-white/80 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/5 hover:border-[#c6ff3d]/30 hover:text-[#c6ff3d]">Payments</span>
                                <span className="text-[12px] font-semibold bg-white/3 border border-white/6 text-white/80 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/5 hover:border-[#c6ff3d]/30 hover:text-[#c6ff3d]">Venues</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 border-t border-white/6 pt-7">
                            <div className="flex flex-col gap-3">
                                <div className="text-[12px] font-bold uppercase tracking-[1.5px] text-white/40 flex items-center gap-1.5">
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                                    Login As
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Link href="/super-admin/login" className="text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all duration-200 bg-white/3 border border-white/8 text-[#818cf8] hover:bg-white/6 hover:border-white/12" style={{ borderColor: "rgba(99, 102, 241, 0.5)" }}>Super Admin</Link>
                                    <Link href="/login" className="text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all duration-200 bg-[#c6ff3d] border border-[#c6ff3d] text-[#08080f] hover:bg-[#b5eb29] hover:shadow-[0_0_15px_rgba(198,255,61,0.3)]">Club Admin</Link>
                                    <Link href="/login-member" className="text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all duration-200 bg-white/3 border border-white/8 text-white/85 hover:bg-white/6 hover:border-white/12">Member</Link>
                                    <Link href="/login-venue" className="text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all duration-200 bg-white/3 border border-white/8 text-white/85 hover:bg-white/6 hover:border-white/12">Venue Owner</Link>
                                    <Link href="/login-user" className="text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all duration-200 bg-white/3 border border-white/8 text-white/85 hover:bg-white/6 hover:border-white/12">User</Link>
                                    <Link href="/login-trainer" className="text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all duration-200 bg-white/3 border border-white/8 text-white/85 hover:bg-white/6 hover:border-white/12">Trainer</Link>
                                </div>
                            </div>

                            <div className="flex items-center justify-center my-1">
                                <span className="text-[11px] font-bold uppercase text-white/25">or</span>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="text-[12px] font-bold uppercase tracking-[1.5px] text-white/40 flex items-center gap-1.5">
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                                    Register As
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Link href="/register" className="text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all duration-200 bg-[#c6ff3d]/8 border border-[#c6ff3d]/20 text-[#c6ff3d] hover:bg-[#c6ff3d]/15 hover:border-[#c6ff3d]/30">Club Admin</Link>
                                    <Link href="/register-member" className="text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all duration-200 bg-white/3 border border-white/8 text-white/80 hover:bg-white/6 hover:border-white/12">Member</Link>
                                    <Link href="/register-venue" className="text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all duration-200 bg-white/3 border border-white/8 text-white/80 hover:bg-white/6 hover:border-white/12">Venue Owner</Link>
                                    <Link href="/register-user" className="text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all duration-200 bg-white/3 border border-white/8 text-white/80 hover:bg-white/6 hover:border-white/12">User</Link>
                                    <Link href="/register-trainer" className="text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all duration-200 bg-white/3 border border-white/8 text-white/80 hover:bg-white/6 hover:border-white/12">Trainer</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Band App Panel ── */}
                <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 relative overflow-hidden group">
                    <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-15 bg-[#ff2e93] -bottom-[100px] -right-[100px] pointer-events-none z-0" aria-hidden="true" />
                    
                    <div className="w-full max-w-[520px] bg-[#0e0e19]/45 border border-white/5 rounded-[24px] p-8 lg:p-10 flex flex-col gap-8 backdrop-blur-[10px] z-10 transition-all duration-400 hover:border-white/10 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative">
                        <div className="absolute top-5 right-5 inline-flex items-center gap-1 text-[10px] font-black bg-gradient-to-br from-[#ff2e93] to-[#ff5b2e] text-white px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(255,46,147,0.3)] z-20">
                            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            NEW
                        </div>

                        <div className="flex flex-col gap-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 bg-[#ff2e93]/8 border border-[#ff2e93]/20 text-[#ff2e93] group-hover:scale-110">
                                    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 18V5l12-2v13" />
                                        <circle cx="6" cy="18" r="3" />
                                        <circle cx="18" cy="16" r="3" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold uppercase tracking-[2px] text-[#ff2e93]">Music Band</span>
                            </div>

                            <h2 className="text-3xl font-extrabold tracking-[-0.5px] text-white">Music Band Platform</h2>
                            <p className="text-[15px] leading-relaxed text-white/60">
                                Book performances, manage artists, venues & earnings.
                                For band admins, artists & venue partners.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <span className="text-[12px] font-semibold bg-white/3 border border-white/6 text-white/80 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/5 hover:border-[#ff2e93]/30 hover:text-[#ff2e93]">Bookings</span>
                                <span className="text-[12px] font-semibold bg-white/3 border border-white/6 text-white/80 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/5 hover:border-[#ff2e93]/30 hover:text-[#ff2e93]">Artists</span>
                                <span className="text-[12px] font-semibold bg-white/3 border border-white/6 text-white/80 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/5 hover:border-[#ff2e93]/30 hover:text-[#ff2e93]">Venues</span>
                                <span className="text-[12px] font-semibold bg-white/3 border border-white/6 text-white/80 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/5 hover:border-[#ff2e93]/30 hover:text-[#ff2e93]">Earnings</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 border-t border-white/6 pt-7">
                            <div className="flex flex-col gap-3">
                                <div className="text-[12px] font-bold uppercase tracking-[1.5px] text-white/40 flex items-center gap-1.5">
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                                    Login As
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Link href="/band/login" className="text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all duration-200 bg-[#ff2e93] border border-[#ff2e93] text-white w-full justify-center hover:bg-[#e01d79] hover:shadow-[0_0_15px_rgba(255,46,147,0.3)]">
                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-1"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                                        Band Admin / Artist
                                    </Link>
                                </div>
                                <span className="text-[11px] leading-relaxed text-white/35">Access the band management dashboard for scheduling and booking coordination.</span>
                            </div>

                            <div className="flex items-center justify-center my-1">
                                <span className="text-[11px] font-bold uppercase text-white/25">or</span>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="text-[12px] font-bold uppercase tracking-[1.5px] text-white/40 flex items-center gap-1.5">
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                                    Register As
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Link href="/band/register" className="text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all duration-200 bg-[#ff2e93]/8 border border-[#ff2e93]/20 text-[#ff2e93] w-full justify-center hover:bg-[#ff2e93]/15 hover:border-[#ff2e93]/30">
                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-1"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                                        Band Admin / Artist
                                    </Link>
                                </div>
                                <span className="text-[11px] leading-relaxed text-white/35">Create a new band or artist account to publish profiles and accept event bookings.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="h-14 border-t border-white/5 flex items-center justify-center gap-1.5 text-xs text-white/40 bg-[#05050a] z-10 relative">
                <span>©</span>
                <span>2026 MUKIJO.</span>
                All rights reserved.
            </footer>
        </main>
    );
}
