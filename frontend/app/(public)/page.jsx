"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Music,
  Building2,
  Dumbbell,
  Trophy,
  ShieldCheck,
  Star,
  Search,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Users2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnifiedLandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCity, setSelectedCity] = React.useState("Bangalore");
  const [activeSearchTab, setActiveSearchTab] = React.useState("all"); // "all" | "sports" | "music"

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (activeSearchTab === "sports" || searchQuery.toLowerCase().includes("turf") || searchQuery.toLowerCase().includes("court") || searchQuery.toLowerCase().includes("cricket") || searchQuery.toLowerCase().includes("football")) {
      router.push(`/venues?search=${encodeURIComponent(searchQuery)}&city=${selectedCity}`);
    } else if (activeSearchTab === "music" || searchQuery.toLowerCase().includes("band") || searchQuery.toLowerCase().includes("singer") || searchQuery.toLowerCase().includes("dj") || searchQuery.toLowerCase().includes("music")) {
      router.push(`/artists?search=${encodeURIComponent(searchQuery)}&city=${selectedCity}`);
    } else {
      router.push(`/venues?search=${encodeURIComponent(searchQuery)}&city=${selectedCity}`);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-primary text-text-primary">
      {/* Dynamic Background Glow Overlays */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 glow-overlay pointer-events-none opacity-40" />

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. HERO BANNER */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-500/10 via-primary/10 to-emerald-500/10 rounded-full border border-border text-xs sm:text-sm font-bold mb-6 backdrop-blur-md shadow-sm">
          <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span className="bg-gradient-to-r from-emerald-400 via-primary to-emerald-400 bg-clip-text text-transparent">
            ONE UNIFIED PLATFORM • ACTIVE LIVING & LIVE ENTERTAINMENT
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-6 tracking-tight leading-[1.08] text-balance max-w-5xl">
          Your All-In-One Gateway to{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Sports Arenas
          </span>{" "}
          &{" "}
          <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Live Entertainment
          </span>
        </h1>

        <p className="text-base sm:text-xl text-text-secondary max-w-3xl mb-10 leading-relaxed text-balance">
          Book verified turf courts, join sports clubs, and hire certified coaches — or discover and hire world-class live bands, solo musicians, and event venues with guaranteed escrow protection.
        </p>

        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* 2. UNIVERSAL QUICK SEARCH BAR */}
        {/* ──────────────────────────────────────────────────────────────────── */}
        <div className="w-full max-w-3xl glass-card p-3 sm:p-4 rounded-2xl border border-border/80 shadow-2xl mb-16">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Search in:</span>
            <button
              type="button"
              onClick={() => setActiveSearchTab("all")}
              className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${activeSearchTab === "all"
                ? "bg-bg-elevated text-text-primary border border-border"
                : "text-text-secondary hover:text-text-primary"
                }`}
            >
              All Categories
            </button>
            <button
              type="button"
              onClick={() => setActiveSearchTab("sports")}
              className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${activeSearchTab === "sports"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-text-secondary hover:text-text-primary"
                }`}
            >
              ⚽ Sports & Turfs
            </button>
            <button
              type="button"
              onClick={() => setActiveSearchTab("music")}
              className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${activeSearchTab === "music"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-text-secondary hover:text-text-primary"
                }`}
            >
              🎸 Live Bands & Gigs
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeSearchTab === "sports"
                    ? "Search turf courts, football grounds, cricket pitches, coaches..."
                    : activeSearchTab === "music"
                      ? "Search rock bands, jazz singers, DJs, acoustic artists, pubs..."
                      : "Search turfs, cricket grounds, live bands, coaches, music venues..."
                }
                className="w-full pl-10 pr-4 py-3 bg-bg-elevated/80 border border-border/80 rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-3 bg-bg-elevated/80 border border-border/80 rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              <option value="Bangalore">📍 Bangalore</option>
              <option value="Mumbai">📍 Mumbai</option>
              <option value="Delhi">📍 Delhi NCR</option>
              <option value="Hyderabad">📍 Hyderabad</option>
              <option value="Chennai">📍 Chennai</option>
            </select>

            <Button type="submit" className="h-12 px-6 font-bold text-sm bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 text-white rounded-xl shadow-lg">
              Explore
            </Button>
          </form>
        </div>

        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* 3. DUAL GATEWAY INTERACTIVE CARDS (THE TWO DOORS) */}
        {/* ──────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full text-left">
          {/* ⚽ DOOR 1: MOKIJO SPORTS */}
          <div className="relative group rounded-3xl p-8 sm:p-10 bg-gradient-to-b from-emerald-500/10 via-bg-card to-bg-card border border-emerald-500/30 hover:border-emerald-500/60 transition-all duration-300 shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                  <Activity className="h-7 w-7" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Mokijo Sports
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black mb-3 text-text-primary group-hover:text-emerald-400 transition-colors">
                Play, Train & Compete
              </h2>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-6">
                Your premier destination for turf ground bookings, club fixtures, professional athletic coaching, and live tournament scoreboards.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Real-time instant turf & court slot reservations</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Certified coach training batches & skill academies</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Club roster management, dues tracking & team fixtures</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Live scoreboards for Badminton, Football, Cricket & more</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap gap-2 mb-6">
                <Link
                  href="/venues"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-emerald-500/10 hover:text-emerald-400 border border-border transition-colors flex items-center gap-1.5"
                >
                  <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Book Turfs</span>
                </Link>
                <Link
                  href="/trainings"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-emerald-500/10 hover:text-emerald-400 border border-border transition-colors flex items-center gap-1.5"
                >
                  <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Find Trainers</span>
                </Link>
                <Link
                  href="/scoreboard"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-emerald-500/10 hover:text-emerald-400 border border-border transition-colors flex items-center gap-1.5"
                >
                  <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Live Scores</span>
                </Link>
              </div>

              <Link href="/mokijo" className="block w-full">
                <Button className="w-full h-13 font-black text-base bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl shadow-lg flex items-center justify-center gap-2 group-hover:gap-3 transition-all">
                  <span>Enter Sports Hub</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* 🎸 DOOR 2: BANDCONNECT */}
          <div className="relative group rounded-3xl p-8 sm:p-10 bg-gradient-to-b from-primary/15 via-bg-card to-bg-card border border-primary/30 hover:border-primary/60 transition-all duration-300 shadow-2xl hover:shadow-primary/10 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/15 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/25 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-primary/10 border border-primary/30 rounded-2xl text-primary">
                  <Music className="h-7 w-7" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">
                  BandConnect
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black mb-3 text-text-primary group-hover:text-primary transition-colors">
                Live Music & Performers
              </h2>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-6">
                The premier live entertainment marketplace to discover, audition, and hire world-class music bands and solo artists with 100% escrow protection.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Verified solo performers, acoustic duos & full rock bands</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Safe escrow payouts: 100% held until gig completion</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Direct gig contracts, date availability & setlist coordination</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Curated music venues, pubs, club stages & private events</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap gap-2 mb-6">
                <Link
                  href="/artists"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-primary/10 hover:text-primary border border-border transition-colors flex items-center gap-1.5"
                >
                  <Music className="h-3.5 w-3.5 text-primary" />
                  <span>Hire Bands</span>
                </Link>
                <Link
                  href="/band/venues"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-primary/10 hover:text-primary border border-border transition-colors flex items-center gap-1.5"
                >
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span>Music Venues</span>
                </Link>
                <Link
                  href="/band/register?role=artist"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-primary/10 hover:text-primary border border-border transition-colors flex items-center gap-1.5"
                >
                  <Users2 className="h-3.5 w-3.5 text-primary" />
                  <span>Join as Performer</span>
                </Link>
              </div>

              <Link href="/band" className="block w-full">
                <Button className="w-full h-13 font-black text-base bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg flex items-center justify-center gap-2 group-hover:gap-3 transition-all">
                  <span>Enter BandConnect</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* 4. PLATFORM-WIDE TRUST & STATS BAR */}
        {/* ──────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full mt-16 p-6 sm:p-8 rounded-3xl bg-bg-card border border-border/80 shadow-xl">
          <div className="text-center">
            <div className="text-2xl sm:text-4xl font-black text-emerald-400 mb-1">50+</div>
            <div className="text-xs sm:text-sm font-semibold text-text-secondary">Verified Sports Turfs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-4xl font-black text-primary mb-1">200+</div>
            <div className="text-xs sm:text-sm font-semibold text-text-secondary">Live Music Bands & Artists</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-4xl font-black text-amber-400 mb-1">15,000+</div>
            <div className="text-xs sm:text-sm font-semibold text-text-secondary">Booked Hours & Gigs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-4xl font-black text-sky-400 mb-1">100%</div>
            <div className="text-xs sm:text-sm font-semibold text-text-secondary">Escrow & Razorpay Secured</div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* 5. COMMERCIAL ONBOARDING CARDS (FOR VENUE OWNERS, COACHES & ARTISTS) */}
        {/* ──────────────────────────────────────────────────────────────────── */}
        <div className="w-full mt-20 text-left">
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-black mb-3">Partner with Mokijo</h3>
            <p className="text-sm sm:text-base text-text-secondary">
              Whether you manage a sports turf, coach athletes, perform live music, or own an event venue — Mokijo helps you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/mokijo/register-venue"
              className="p-6 rounded-2xl bg-bg-card border border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
            >
              <Building2 className="h-6 w-6 text-emerald-400 mb-3" />
              <h4 className="font-bold text-base mb-1 group-hover:text-emerald-400">List Sports Venue</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Accept online court bookings and automate slot payments.
              </p>
            </Link>

            <Link
              href="/mokijo/register-trainer"
              className="p-6 rounded-2xl bg-bg-card border border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
            >
              <Dumbbell className="h-6 w-6 text-emerald-400 mb-3" />
              <h4 className="font-bold text-base mb-1 group-hover:text-emerald-400">Join as Coach</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Host training batches, manage player progress, and earn.
              </p>
            </Link>

            <Link
              href="/band/register?role=artist"
              className="p-6 rounded-2xl bg-bg-card border border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <Music className="h-6 w-6 text-primary mb-3" />
              <h4 className="font-bold text-base mb-1 group-hover:text-primary">Join as Live Band</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Showcase your demo reels and receive direct gig bookings.
              </p>
            </Link>

            <Link
              href="/band/register?role=venue_owner"
              className="p-6 rounded-2xl bg-bg-card border border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <Building2 className="h-6 w-6 text-primary mb-3" />
              <h4 className="font-bold text-base mb-1 group-hover:text-primary">List Music Venue</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Promote stage slots, host live gigs, and manage ticket events.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

                List Music Venue
              </h4 >
  <p className="text-xs text-slate-500 leading-relaxed">
    Promote stage slots, host live gigs, and manage ticket events.
  </p>
            </Link >
          </div >
        </div >
      </section >
    </div >
  );
}
